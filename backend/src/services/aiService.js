/**
 * Hybrid Smart Architecture - AI Byte Solver
 * Default: Ollama + Llama 3 (FREE, zero cost, high accuracy)
 * Premium: Gemini (advanced reasoning, controlled usage)
 */
import UploadedPDF from '../models/UploadedPDF.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const BASE_SYSTEM = `You are AI Byte Solver, an education-focused AI doubt-solving assistant for students.
Your role is strictly academic: help students understand concepts, solve doubts, and prepare for exams.

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

  if (mode === 'syllabus' && pdfId) {
    const pdf = await UploadedPDF.findById(pdfId).lean();
    if (pdf?.extractedText) {
      system +=
        SYLLABUS_MODE_ADDON +
        `

## Syllabus Content (from: ${pdf.originalName})

${pdf.extractedText.substring(0, 12000)}

Use ONLY the above content to answer. Cite: "From ${pdf.originalName}, [topic]: ..."`;
    } else {
      system += SYLLABUS_MODE_ADDON + '\n\nNo syllabus content available. Ask user to upload a PDF.';
    }
  } else {
    system += OPEN_MODE_ADDON;
  }

  return system;
};

/**
 * Ollama (FREE) - Uses Llama 3, zero cost, local inference
 */
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
    throw new Error(`Ollama error: ${res.status}. Ensure Ollama is running: ollama run ${OLLAMA_MODEL}`);
  }

  return res;
};

/**
 * Gemini (PREMIUM) - Advanced reasoning, requires API key
 */
let geminiModel = null;
const getGemini = async () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY required for premium mode. Use free mode (Ollama) instead.');
  if (!geminiModel) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return geminiModel;
};

/**
 * Unified streaming: yields { content: string } chunks
 */
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

async function* streamGemini(stream) {
  for await (const chunk of stream) {
    const text = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '');
    if (text) yield { content: text };
  }
}

/**
 * Main AI interface - streaming response (async iterable)
 */
export const getAIResponse = async function* (messages, mode, pdfId, aiProvider = 'ollama') {
  const systemPrompt = await buildSystemPrompt(mode, pdfId);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  if (aiProvider === 'gemini') {
    const model = await getGemini();
    const systemMsg = apiMessages.find((m) => m.role === 'system');
    const lastMsg = apiMessages[apiMessages.length - 1];
    const fullPrompt = systemMsg ? `${systemMsg.content}\n\n${lastMsg?.content || ''}` : lastMsg?.content || '';
    const result = await model.generateContentStream(fullPrompt);
    yield* streamGemini(result.stream);
  } else {
    const res = await callOllama(apiMessages, true);
    yield* streamOllama(res.body);
  }
};

/**
 * Main AI interface - non-streaming response
 */
export const getAIResponseNonStream = async (messages, mode, pdfId, aiProvider = 'ollama') => {
  const systemPrompt = await buildSystemPrompt(mode, pdfId);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  if (aiProvider === 'gemini') {
    const model = await getGemini();
    const systemMsg = apiMessages.find((m) => m.role === 'system');
    const lastMsg = apiMessages[apiMessages.length - 1];
    const fullPrompt = systemMsg ? `${systemMsg.content}\n\n${lastMsg?.content || ''}` : lastMsg?.content || '';
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

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
    throw new Error(`Ollama error: ${res.status}. Ensure Ollama is running: ollama run ${OLLAMA_MODEL}`);
  }

  const data = await res.json();
  return data.message?.content || '';
};
