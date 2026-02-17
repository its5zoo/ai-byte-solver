/**
 * AI Byte Solver - Ollama only
 */
import UploadedPDF from '../models/UploadedPDF.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';

const BASE_SYSTEM = `You are AI Byte Solver, an education-focused AI doubt-solving assistant for students.
Your role is strictly academic: help students understand concepts, solve doubts, and prepare for exams.

CRITICAL: Answer ONLY the exact question the user asked. Do not substitute or confuse with other topics (e.g. if they ask about Green's theorem, do NOT answer about Newton's laws or inertial force; if they ask about one concept, answer that concept only).

CONSTRAINTS:
- Never generate non-academic content (games, stories, jokes, non-educational material).
- Support Hinglish and casual student language.
- Detect difficulty level of questions (easy/medium/hard) and adjust explanations accordingly.
- When appropriate, provide summaries, formula lists, and key takeaways.
- Use LaTeX for math: \\( inline \\) and \\[ block \\].

Respond concisely, clearly, and academically.`;

const SYLLABUS_MODE_ADDON = `
MODE: Syllabus Mode
- Answer ONLY from the provided syllabus content below.
- Always mention the PDF name and chapter/topic when answering.
- If the answer is not in the syllabus, say: "This topic is not in your uploaded syllabus. Please upload the relevant PDF or switch to Open Source Mode."
- Do not hallucinate or guess. Strictly stay within the provided text.`;

const OPEN_MODE_ADDON = `
MODE: Open Source Mode
- Use your knowledge but stay strictly academic and exam-focused.
- No non-academic content.
- You may provide summaries, formula lists, and key points.
- Detect question difficulty and tailor your response.`;

export const buildSystemPrompt = async (mode, pdfId) => {
  let system = BASE_SYSTEM;

  if (mode === 'syllabus') {
    if (pdfId) {
      const pdf = await UploadedPDF.findById(pdfId).lean();
      if (pdf?.extractedText) {
        system +=
          SYLLABUS_MODE_ADDON +
          `

## Syllabus Content (from: ${pdf.originalName})

${pdf.extractedText.substring(0, 12000)}

Use ONLY the above content to answer. Cite: "From ${pdf.originalName}, [topic]: ..."`;
      } else {
        system += SYLLABUS_MODE_ADDON + '\n\nNo syllabus content available for this PDF. Ask user to re-upload or switch to Open Mode.';
      }
    } else {
      system +=
        SYLLABUS_MODE_ADDON +
        '\n\nNo syllabus PDF is attached to this chat. Answer from your knowledge but say: "No PDF is attached for syllabus mode. Upload a PDF in the sidebar for answers from your materials." Do not confuse the user\'s topic with other topics.';
    }
  } else {
    system += OPEN_MODE_ADDON;
  }

  return system;
};

const callOllama = async (messages, stream = false) => {
  const url = `${OLLAMA_BASE}/api/chat`;
  const body = {
    model: OLLAMA_MODEL,
    messages,
    stream,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    const hint = res.status === 404
      ? `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL} && ollama run ${OLLAMA_MODEL}`
      : `Ensure Ollama is running at ${OLLAMA_BASE}: ollama run ${OLLAMA_MODEL}`;
    throw new Error(`Ollama error: ${res.status}. ${hint}`);
  }

  return res;
};

async function* streamOllama(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const delta = json.message?.content || '';
        if (delta) yield { content: delta };
      } catch (_) {}
    }
  }
}

export const getAIResponse = async function* (messages, mode, pdfId) {
  const systemPrompt = await buildSystemPrompt(mode, pdfId);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await callOllama(apiMessages, true);
  yield* streamOllama(res.body);
};

export const getAIResponseNonStream = async (messages, mode, pdfId) => {
  const systemPrompt = await buildSystemPrompt(mode, pdfId);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  const url = `${OLLAMA_BASE}/api/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: apiMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    const hint = res.status === 404
      ? `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL} && ollama run ${OLLAMA_MODEL}`
      : `Ensure Ollama is running at ${OLLAMA_BASE}: ollama run ${OLLAMA_MODEL}`;
    throw new Error(`Ollama error: ${res.status}. ${hint}`);
  }

  const data = await res.json();
  return data.message?.content || '';
};
