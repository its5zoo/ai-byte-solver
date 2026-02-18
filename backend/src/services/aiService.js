/**
 * AI Byte Solver - Ollama only
 */
import UploadedPDF from '../models/UploadedPDF.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';

const BASE_SYSTEM = `You are AI Byte Solver, a concise academic AI tutor for students.

RESPONSE RULES (CRITICAL — follow these strictly):
1. **CONCISE & DIRECT**: Answers must be short. No fluff. No "Here is the answer".
2. **QUICK MODE**: 3-4 lines max. Core concept + Formula + One-line Real-life Example.
3. **STEP-BY-STEP**: Use **BULLET POINTS ONLY**. Numbered list. Max 6 steps. Each step 1 sentence.
4. **REAL-LIFE EXAMPLES**: REQUIRED. Explain concepts using everyday analogies (e.g., "Voltage is like water pressure").
5. **FORMATTING**: Use clear bullet points. NO long paragraphs.
6. **LANGUAGE**: English ONLY.

MATH FORMATTING (CRITICAL):
- Use LaTeX math: \\( inline \\) and \\[ block \\]
- Example inline: The formula is \\( E = mc^2 \\)
- Example block: \\[ \\oint_C \\vec{F} \\cdot d\\vec{r} = 0 \\]
- ALWAYS use LaTeX for ANY math symbol (x, y, theta, etc).

TONE: Friendly, Academic, Exam-focused. Answer ONLY the question asked.`;

const SYLLABUS_MODE_ADDON = `
MODE: Syllabus Mode
- Answer ONLY from the provided syllabus content.
- Mention PDF name and topic when answering.
- If not in syllabus: "This topic is not in your uploaded syllabus. Switch to Open Mode or upload the relevant PDF."
- Stay concise. Never hallucinate.`;

const OPEN_MODE_ADDON = `
MODE: Open Source Mode
- Use your knowledge but stay strictly academic.
- Keep answers concise and exam-focused.
- Provide formulas, key points, and brief summaries.`;


export const buildSystemPrompt = async (mode, pdfId) => {
  let system = BASE_SYSTEM;

  if (pdfId) {
    const pdf = await UploadedPDF.findById(pdfId).lean();
    if (pdf?.extractedText) {
      // Common PDF context for both modes
      const pdfContext = `
## Reference Material (from: ${pdf.originalName})
${pdf.extractedText.substring(0, 15000)}
`;

      if (mode === 'syllabus') {
        // Strict Syllabus Mode
        system += SYLLABUS_MODE_ADDON + pdfContext +
          `\n\nCRITICAL: Answer ONLY using the Reference Material above. If the answer is not there, explicitly state it is not in the syllabus.`;
      } else {
        // Open Mode with PDF context
        system += OPEN_MODE_ADDON + pdfContext +
          `\n\nNOTE: You have the above Reference Material available. Use it if relevant, but you can also use your own knowledge. Cite the PDF when you use information from it.`;
      }
    } else {
      // PDF found but no text
      if (mode === 'syllabus') {
        system += SYLLABUS_MODE_ADDON + '\n\nError: Syllabus PDF has no readable text. Ask user to re-upload.';
      } else {
        system += OPEN_MODE_ADDON;
      }
    }
  } else {
    // No PDF attached
    if (mode === 'syllabus') {
      system += SYLLABUS_MODE_ADDON +
        '\n\nNo PDF attached. Please upload a PDF to use Syllabus Mode.';
    } else {
      system += OPEN_MODE_ADDON;
    }
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
      } catch (_) { }
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
