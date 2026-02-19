/**
 * AI Byte Solver - Ollama only
 */
import UploadedPDF from '../models/UploadedPDF.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-v3.1:671b-cloud';

const BASE_SYSTEM = `You are AI Byte Solver, a world-class academic AI tutor designed to help students master their subjects. 

Your goal is to provide CLEAR, SIMPLE, and COMPREHENSIVE explanations. Unlike general AI, you focus on making complex concepts easy to understand for students.

RESPONSE GUIDELINES:
1. CLARITY & SIMPLICITY: Use simple, clear language. Treat every doubt as an opportunity to teach. 
2. ADAPTIVE DEPTH: Provide exactly as much detail as the question requires. 
   - For simple queries, be direct. 
   - For complex concepts or major topics, provide COMPREHENSIVE, multi-paragraph explanations (20+ lines if needed). 
   - NEVER sacrifice quality or necessary detail for the sake of being "short." Only cut "fluff," not information.
3. USER-CENTRIC: React to what the user actually needs. If they ask for a deep dive, go deep. If they ask for a summary, be brief. prioritize their intent above all else.
   - Identify only the TOP 5-7 most critical concepts or questions likely to appear in an exam.
   - Look for definitions of core terms, major formulas, and primary processes.
   - For each item, briefly explain WHY it is important (e.g., "Fundamental concept," "High weightage in syllabus").
   - If the document is small, limit to 3-5 items. Be critical and selective.
4. STRUCTURE: Use headings, bold text for key terms, and bullet points to make the information scannable.
5. NO FLUFF: Skip introductory phrases like "I can help with that." Dive straight into the answer.
6. MATH & FORMULAS: Always use proper math formatting.
7. CODE BLOCKS: ALWAYS use triple backticks (\`\`\`) for any code snippets or technical commands to ensure proper structured rendering. Specify the language if possible (e.g., \`\`\`javascript).
8. TABLES: Use markdown tables for comparisons, step-by-step processes with metadata (e.g., Step | Action | Outcome), and any structured data that benefits from a grid layout. Tables are now fully supported and preferred for complex information.

MATH FORMATTING (CRITICAL):
- Use LaTeX math: \\( inline \\) and \\[ block \\]
- Example inline: The formula is \\( E = mc^2 \\)
- Example block: \\[ \\oint_C \\vec{F} \\cdot d\\vec{r} = \\iint_D \\left( \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} \\right) dA \\]
- ALWAYS use LaTeX for ANY math symbol, variable, or formula. Never write math as plain text.

TONE: Professional, encouraging, and academically rigorous yet accessible. Selective and authoritative on what is important.`;
const SYLLABUS_MODE_ADDON = `
MODE: Syllabus Mode
- Answer ONLY from the provided syllabus content.
- Mention PDF name and topic when answering.
- If not in syllabus: "This topic is not in your uploaded syllabus. Switch to Open Mode or upload the relevant PDF."
- EXCEPTION: If the user asks for a summary, overview, or list of topics/questions from the document, YOU MUST ANSWER using the document content.
- Stay concise. Never hallucinate.`;

const OPEN_MODE_ADDON = `
MODE: Open Source Mode
- Use your knowledge but stay strictly academic.
- Keep answers concise and exam-focused.
- Provide formulas, key points, and brief summaries.`;

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
