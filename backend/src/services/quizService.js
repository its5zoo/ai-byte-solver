/**
 * Quiz generation - Ollama only
 */
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import Quiz from '../models/Quiz.js';
import { AppError } from '../middleware/errorHandler.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';

const callOllama = async (prompt) => {
  const url = `${OLLAMA_BASE}/api/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });
  if (!res.ok) {
    const hint = res.status === 404
      ? `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL} && ollama run ${OLLAMA_MODEL}`
      : `Ensure Ollama is running at ${OLLAMA_BASE}.`;
    throw new Error(`Ollama error: ${res.status}. ${hint}`);
  }
  const data = await res.json();
  return data.message?.content || '[]';
};

function findLastIndex(arr, predicate) {
  for (let i = arr.length - 1; i >= 0; i--) if (predicate(arr[i], i)) return i;
  return -1;
}

function buildFocusedContext(messages) {
  const cleaned = (messages || []).filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'));
  if (!cleaned.length) return null;

  const lastUserIdx = findLastIndex(cleaned, (m) => m.role === 'user');
  if (lastUserIdx === -1) return null;

  const lastUser = cleaned[lastUserIdx]?.content?.trim() || '';
  const lastAssistant = cleaned.slice(lastUserIdx + 1).find((m) => m.role === 'assistant')?.content?.trim()
    || cleaned.slice().reverse().find((m) => m.role === 'assistant')?.content?.trim()
    || '';

  if (!lastUser || !lastAssistant) return null;

  return {
    userQuestion: lastUser.substring(0, 2500),
    assistantAnswer: lastAssistant.substring(0, 6500),
  };
}

function extractJsonArray(raw) {
  const s = String(raw || '').trim();

  // Strategy 1: strip code fences and try direct parse
  const stripped = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
    // Sometimes model wraps in { questions: [...] }
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  } catch (_) { /* fall through */ }

  // Strategy 2: find the first [...] block in the raw string
  const arrayStart = s.indexOf('[');
  const arrayEnd = s.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      const slice = s.slice(arrayStart, arrayEnd + 1);
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) { /* fall through */ }
  }

  // Strategy 3: try to find JSON array inside code fences
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch (_) { /* fall through */ }
  }

  return [];
}

function normalizeQuestions(raw, wantCount) {
  const parsed = extractJsonArray(raw);

  const out = [];
  for (const q of parsed) {
    if (!q || typeof q !== 'object') continue;
    const question = typeof q.question === 'string' ? q.question.trim() : '';
    const options = Array.isArray(q.options) ? q.options.map((o) => (typeof o === 'string' ? o.trim() : String(o || '').trim())).filter(Boolean) : [];
    const correctOption = Number.isFinite(Number(q.correctOption)) ? Number(q.correctOption) : 0;
    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    if (!question || options.length < 2) continue;
    const finalOptions = options.slice(0, 4);
    while (finalOptions.length < 4) finalOptions.push('None of the above');
    const safeCorrect = Math.min(3, Math.max(0, correctOption));
    out.push({
      type: 'mcq',
      question,
      options: finalOptions,
      correctOption: safeCorrect,
      explanation: explanation.slice(0, 600),
      topic: typeof q.topic === 'string' ? q.topic.trim().slice(0, 60) : '',
      difficulty: typeof q.difficulty === 'string' ? q.difficulty.trim() : 'easy',
    });
    if (out.length >= wantCount) break;
  }
  return out;
}


export const generateQuiz = async (userId, sessionId, count = 5, difficulty = 'easy') => {
  const session = await ChatSession.findOne({ _id: sessionId, userId }).lean();
  if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');

  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .select('role content')
    .lean();

  const focused = buildFocusedContext(messages);
  if (!focused) throw new AppError('Not enough chat context to generate a quiz. Ask a doubt first.', 422, 'NO_CONTEXT');

  const prompt = `You are an exam-focused tutor. Create a VERY EASY confidence-building quiz strictly from the solved doubt below.

Solved Doubt (use ONLY this; do not introduce new topics/theorems):
Student question:
${focused.userQuestion}

Tutor solution:
${focused.assistantAnswer}

Requirements:
- Generate exactly ${count} MCQ (multiple choice) questions ONLY (option-based).
- Difficulty: easy (even if the original doubt was hard). Keep wording simple and clear.
- Each question must be directly derived from the tutor solution above (same formulas, same steps, same concept).
- Do NOT add any unrelated questions. Do NOT jump to adjacent chapters.
- Prefer small-step checks: identify formula, substitution, sign, orientation, units, or final value.
- Use math formatting only when needed, and use LaTeX delimiters \\( ... \\) for inline and \\[ ... \\] for block.
- Add a short explanation (1–3 lines) for why the correct option is correct (study-only).
- Output valid JSON only, no markdown, no extra text. Format:
[
  { "type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "correctOption": 0, "topic": "...", "difficulty": "easy", "explanation": "..." }
]`;

  const raw = await callOllama(prompt);
  const questions = normalizeQuestions(raw, count);
  if (!questions.length) throw new AppError('Failed to generate quiz questions. Try again.', 500, 'QUIZ_GENERATION_FAILED');

  const quiz = await Quiz.create({
    userId,
    sessionId,
    title: `Quiz - ${session.title || 'Chat'}`,
    difficulty: 'easy',
    questions: questions.map((q) => ({
      type: 'mcq',
      question: q.question || '',
      options: q.options || [],
      correctOption: q.correctOption ?? 0,
      explanation: q.explanation || '',
      topic: q.topic || '',
      difficulty: 'easy',
    })),
  });

  return quiz;
};

export const evaluateAttempt = async (quizId, userId, answers) => {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
  if (quiz.userId.toString() !== userId.toString()) throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');

  let correct = 0;
  const details = [];

  for (let i = 0; i < (quiz.questions || []).length; i++) {
    const q = quiz.questions[i];
    const ans = answers?.find((a) => a.questionId?.toString() === q._id?.toString());
    let isCorrect = false;
    if (q.type === 'mcq') {
      const selected = Number(ans?.selectedOption);
      // -1 means unanswered; never matches a valid option
      isCorrect = selected >= 0 && selected === Number(q.correctOption);
    } else {
      const given = (ans?.shortAnswer || '').trim().toLowerCase();
      const expected = (q.correctAnswer || '').trim().toLowerCase();
      isCorrect = given && expected && given.includes(expected);
    }
    if (isCorrect) correct++;
    details.push({
      questionId: q._id,
      question: q.question,
      options: q.options || [],
      selectedOption: Number.isFinite(Number(ans?.selectedOption)) ? Number(ans.selectedOption) : null,
      correctOption: Number.isFinite(Number(q.correctOption)) ? Number(q.correctOption) : null,
      isCorrect,
      explanation: q.explanation || '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'easy',
    });
  }

  const total = quiz.questions?.length || 1;
  const wrong = total - correct;

  // Negative marking: +1 correct, -0.5 wrong
  const netScore = correct * 1 + wrong * (-0.5);
  const maxScore = total * 1;
  const percentage = Math.min(100, Math.max(0, Math.round((netScore / maxScore) * 100)));

  return { score: correct, total, percentage, details };
};
