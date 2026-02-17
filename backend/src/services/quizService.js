/**
 * Quiz generation - Ollama only
 */
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import Quiz from '../models/Quiz.js';
import { AppError } from '../middleware/errorHandler.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b';

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

export const generateQuiz = async (userId, sessionId, count = 5, difficulty = 'mixed') => {
  const session = await ChatSession.findOne({ _id: sessionId, userId }).lean();
  if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');

  const messages = await ChatMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .select('role content')
    .lean();

  const context = messages
    .filter((m) => m.content)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n')
    .substring(0, 8000);

  const prompt = `Based on the following chat about academic topics, generate exactly ${count} quiz questions.

Context:
${context}

Requirements:
- Generate ${Math.ceil(count * 0.7)} MCQ (multiple choice) and ${Math.ceil(count * 0.3)} short-answer questions.
- Difficulty: ${difficulty}.
- Output valid JSON only, no markdown. Format:
[
  { "type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "correctOption": 0, "topic": "...", "difficulty": "easy|medium|hard" },
  { "type": "short", "question": "...", "correctAnswer": "...", "topic": "...", "difficulty": "easy|medium|hard" }
]`;

  const raw = await callOllama(prompt);

  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (_) {
    questions = [];
  }
  if (!Array.isArray(questions)) questions = [];

  const quiz = await Quiz.create({
    userId,
    sessionId,
    title: `Quiz - ${session.title || 'Chat'}`,
    difficulty,
    questions: questions.map((q) => ({
      type: q.type || 'mcq',
      question: q.question || '',
      options: q.options || [],
      correctOption: q.correctOption ?? 0,
      correctAnswer: q.correctAnswer || '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'medium',
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
      isCorrect = Number(ans?.selectedOption) === Number(q.correctOption);
    } else {
      const given = (ans?.shortAnswer || '').trim().toLowerCase();
      const expected = (q.correctAnswer || '').trim().toLowerCase();
      isCorrect = given && expected && given.includes(expected);
    }
    if (isCorrect) correct++;
    details.push({ questionId: q._id, isCorrect });
  }

  const total = quiz.questions?.length || 1;
  const percentage = Math.round((correct / total) * 100);

  return { score: correct, total, percentage, details };
};
