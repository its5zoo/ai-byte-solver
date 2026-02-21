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
7. STRUCTURE: Use headings, bold text, and bullet points. NEVER use excessive markdown stars ('*') for simple text; keep it clean.
8. IMAGES & VISUALS: If the user asks for a picture, image, photograph, chart, or analytical graph of a concept, OR if you are explaining a complex/abstract concept (like an algorithm or scientific process) where a visual would help, you MUST generate a high-quality visual using the following exact markdown format: 
![Description of image](https://pollinations.ai/p/Highly%20detailed%20description%20of%20the%20image?width=800&height=400&enhance=true&safe=true&nologo=true)
CRITICAL RULES FOR IMAGES:
- You MUST append ?width=800&height=400&enhance=true&safe=true&nologo=true to the URL.
- safe=true is MANDATORY across all images to strictly block any 18+ or inappropriate content.
- enhance=true is used to generate a rich, high-quality interpretation of the phrase.
- URL encode the spaces in the prompt as %20. DO NOT wrap the markdown link in backticks or code blocks. Example: ![A red apple](https://pollinations.ai/p/A%20bright%20red%20apple%20on%20a%20table?width=800&height=400&enhance=true&safe=true&nologo=true)
9. ACADEMIC BOUNDARIES & SUBJECT HEADER:
   - You are an academic study assistant. If a user asks about entertainment, gossip, movies, or inappropriate topics, POLITELY DECLINE.
   - HOWEVER, if a user asks for an image of an everyday object, person, or seemingly random concept (e.g., "draw an apple", "show an analytical man"), DO NOT REJECT IT. Instead, cleverly connect it to a relevant academic subject (like Biology, Physics, or Data Science) and use the image to teach a concept.
     - Example: If asked for an apple, generate a beautiful image of an apple, label the subject "Physics", and teach them about Newton's gravity using the apple.
   - For EVERY VALID ACADEMIC OR CONCEPTUAL ANSWER, you MUST start your response with a clear Subject Header at the top in this exact format:
     **Subject: [Name of Subject, e.g., Mathematics, Physics, General Knowledge]**

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
- Provide formulas, key points, and alternative approaches where possible.
- REAL IMAGES: If the user specifically asks for a "real picture" or "photograph" of a real-world object or place in this mode, use Unsplash instead of Pollinations. Format it as: ![Real Image](https://source.unsplash.com/800x400/?keyword1,keyword2). Example: ![A real apple](https://source.unsplash.com/800x400/?apple,fruit)`;

const PYQ_MODE_ADDON = `
MODE: PYQ Analysis Mode
- Extract questions from the provided PDFs.
- Find the most repeated questions across the documents and label them as **Repeated Questions** with a frequency count.
- From the remaining questions, identify **Important Questions** based on conceptual depth, definitions, derivations, and exam relevance.
- Ensure that Important Questions do NOT duplicate or overlap with Repeated Questions.
- Detect questions that require diagrams (keywords: draw, sketch, label, circuit, ray diagram, block diagram).
- For diagram-based questions, generate a simple drawable diagram output using Mermaid.js (\` \`\`\`mermaid \`) that students can recreate.
- Return results grouped exactly into these three sections:
  1. Repeated Questions
  2. Important Questions
  3. Diagram-Based Questions
- Keep the output concise and exam-focused.`;

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

export const buildSystemPrompt = async (mode, pdfIds = [], userQuery = '') => {
  if (mode === 'mock-test') {
    return `You are a precise JSON API Exam Generation Engine.
Your ONLY purpose is to output a raw, parseable JSON array of REAL Previous Year Questions (PYQs). Do NOT hallucinate.
DO NOT output ANY markdown (no \`\`\`json), NO conversational text.

You must generate an exact JSON array like this:
[
  {
    "text": "The exact real PYQ question text here. Use $ for inline math like $x^2$ and $$ for block math. Do not use \\\\(. DO NOTINCLUDE ANY DIAGRAMS OR IMAGES. Text only.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0, // for MCQs 0-3. If it's a NUMERICAL question, options should be empty [] and correctAnswerIndex should be null. Include the numerical answer in a "numericalAnswer" key.
    "numericalAnswer": null, // If MCQ, keep null. If numerical, provide the float/int string like "4.5"
    "difficulty": "medium",
    "explanation": "A concise concept explanation and specify the PYQ Year.",
    "topic": "Micro-topic (e.g. Thermodynamics)"
  }
]

RULES:
- Base questions strictly on REAL PAST PAPERS (PYQs) for the requested exam and difficulty.
- EXACTLY 4 unique options.
- OUTPUT ONLY A VALID JSON ARRAY. NO OTHER TEXT.`;
  }

  let system = BASE_SYSTEM + '\n\n';
  let hasValidPdf = false;
  // Ensure pdfIds is an array
  const ids = Array.isArray(pdfIds) ? pdfIds : (pdfIds ? [pdfIds] : []);

  if (ids.length > 0) {
    const pdfs = await UploadedPDF.find({ _id: { $in: ids } }).lean();

    let combinedContext = '';
    let hasReadableText = false;

    for (const pdf of pdfs) {
      if (pdf.extractedText) {
        hasReadableText = true;
        let relevantText = pdf.extractedText;

        // Only use smart slicing if it's not PYQ mode (PYQ needs the whole document usually, or at least a large chunk)
        if (mode !== 'pyq') {
          relevantText = getSmartContext(pdf.extractedText, userQuery);
        } else {
          // For PYQ, give as much context as possible (up to chunks of 15k per doc)
          relevantText = pdf.extractedText.substring(0, 15000);
        }

        combinedContext += `\n## Reference Material (from: ${pdf.originalName})\n${relevantText}\n`;
      }
    }

    if (hasReadableText) {
      if (mode === 'syllabus') {
        system += SYLLABUS_MODE_ADDON + combinedContext +
          `\n\nCRITICAL: Answer ONLY using the Reference Material above. If the answer is not there, explicitly state it is not in the syllabus.`;
      } else if (mode === 'pyq') {
        system += PYQ_MODE_ADDON + combinedContext +
          `\n\nCRITICAL: Analyze the above Reference Material to extract, group, and visualize the requested questions.`;
      } else {
        system += OPEN_MODE_ADDON + combinedContext +
          `\n\nNOTE: You have the above Reference Material available. Use it if relevant, but you can also use your own knowledge. Cite the PDF when you use information from it.`;
      }
    } else {
      if (mode === 'syllabus' || mode === 'pyq') {
        system += (mode === 'syllabus' ? SYLLABUS_MODE_ADDON : PYQ_MODE_ADDON) + '\n\nError: Attached PDFs have no readable text. Ask user to re-upload.';
      } else {
        system += OPEN_MODE_ADDON;
      }
    }
  } else {
    if (mode === 'syllabus' || mode === 'pyq') {
      system += (mode === 'syllabus' ? SYLLABUS_MODE_ADDON : PYQ_MODE_ADDON) +
        `\n\nNo PDF attached. Please upload and attach PDFs to use ${mode === 'pyq' ? 'PYQ Analysis' : 'Syllabus'} Mode.`;
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

export const getAIResponse = async function* (messages, mode, pdfIds) {
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const systemPrompt = await buildSystemPrompt(mode, pdfIds, lastUserMessage);
  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await callOllama(apiMessages, true);
  yield* streamOllama(res.body);
};

export const getAIResponseNonStream = async (messages, mode, pdfIds) => {
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const systemPrompt = await buildSystemPrompt(mode, pdfIds, lastUserMessage);
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
