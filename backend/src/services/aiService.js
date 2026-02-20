/**
 * AI Byte Solver - Ollama only
 */
import UploadedPDF from '../models/UploadedPDF.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-v3.1:671b-cloud';

const BASE_SYSTEM = `You are AI Byte Solver, a world-class academic AI tutor designed to help students master their subjects. 

Explain everything like a friendly mentor or study buddy. Use a warm, encouraging tone.

Your goal is to provide CLEAR, SIMPLE, and COMPREHENSIVE explanations. Unlike general AI, you focus on making complex concepts easy to understand for students.

RESPONSE GUIDELINES:
1. CLARITY & TEACHING TONE: Use friendly, clear language. Treat every doubt as an opportunity to teach. Speak like a friend who explains things simply.
2. ADAPTIVE DEPTH: Provide exactly as much detail as the question requires. 
3. CONCEPT HOOK: At the end of every answer, include a "Concept Hook" — a short, memorable summary or analogy that helps the student lock in the core concept.
4. MATH & FORMULAS: Always use proper math formatting (LaTeX). 
   - CRITICAL: If a math question is asked, ALWAYS provide at least one "Another Approach" or alternative way to solve it.
5. FLOWCHARTS: Use Mermaid.js (\` \`\`\`mermaid \`) blocks to create flowcharts whenever visualizing a concept, process, or logic flow is helpful. Flowcharts should be clean and easy to understand.
6. NO FLUFF: Skip introductory phrases like "I can help with that." Dive straight into the answer.
7. STRUCTURE: Use headings, bold text, and bullet points. NEVER use excessive markdown stars (\`*\`) for simple text; keep it clean.

MATH FORMATTING (CRITICAL):
- Use LaTeX math: \\( inline \\) and \\[ block \\]
- Example inline: The formula is \\( E = mc^2 \\)
- ALWAYS use LaTeX for ANY math symbol, variable, or formula.

TONE: Friendly, encouraging, and academically rigorous yet accessible.`;
const SYLLABUS_MODE_ADDON = `
MODE: Syllabus Mode
- Answer ONLY from the provided syllabus content in a friendly way.
- Mention PDF name and topic when answering.
- Suggest different approaches for understanding the concepts mentioned.
- REVISION QUIZ: At the end of your response, after the Concept Hook, generate a "Revision Quiz" (3 short multiple-choice or fill-in-the-blank questions) based only on what you just taught to help the student test their recall.
- If not in syllabus: "This topic is not in your uploaded syllabus. Switch to Open Mode or upload the relevant PDF."`;

const OPEN_MODE_ADDON = `
MODE: Open Source Mode
- Use your knowledge but stay strictly academic and friendly.
- Keep answers concise but comprehensive.
- Provide formulas, key points, and alternative approaches where possible.`;

// Helper to find relevant context window
const getSmartContext = (text, query) => {
  if (!text) return '';
  const MAX_CONTEXT = 15000;

  // 1. Check for specific Question/Unit references
  // Matches: "Question 5", "Q.5", "Q5", "Chapter 3", "Unit IV"
  const targetMatch = query.match(/(?:question|q|chapter|unit)[\s.]*([0-9]+|[ivx]+)/i);

  if (targetMatch) {
    // Try to find this pattern in the text
    const pattern = new RegExp(`(?:question|q|chapter|unit)[\\s.]*${targetMatch[1]}`, 'i');
    const index = text.search(pattern);

    if (index !== -1) {
      // Found it! Center context around it.
      const start = Math.max(0, index - 2000); // 2k chars before
      const end = Math.min(text.length, start + MAX_CONTEXT);
      console.log(`[Smart Context] Found target "${targetMatch[0]}" at index ${index}. Slicing ${start}-${end}.`);
      return `...${text.substring(start, end)}...`;
    }
  }

  // 2. Default: Return start of text (good for summaries/intros)
  return text.substring(0, MAX_CONTEXT);
};

export const buildSystemPrompt = async (mode, pdfId, userQuery = '') => {
  let system = BASE_SYSTEM;

  if (pdfId) {
    const pdf = await UploadedPDF.findById(pdfId).lean();
    if (pdf?.extractedText) {
      // Use Smart Context
      const relevantText = getSmartContext(pdf.extractedText, userQuery);

      const pdfContext = `
## Reference Material (from: ${pdf.originalName})
${relevantText}
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
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const systemPrompt = await buildSystemPrompt(mode, pdfId, lastUserMessage);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await callOllama(apiMessages, true);
  yield* streamOllama(res.body);
};

export const getAIResponseNonStream = async (messages, mode, pdfId) => {
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const systemPrompt = await buildSystemPrompt(mode, pdfId, lastUserMessage);
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
