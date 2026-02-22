/**
 * AI Router Service – Student-Focused Coding Assistant
 * 
 * Backends: Ollama/gpt-oss (default) → DeepSeek (cloud fallback)
 */
import fetch from 'node-fetch';

// ─── Read keys at request time ─────────────────────────────────────────────

function getKeys() {
    return {
        DEEPSEEK_API_KEY: (process.env.DEEPSEEK_API_KEY || '').trim(),
        DEEPSEEK_BASE_URL: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim(),
        OLLAMA_URL: process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud',
    };
}

// ─── System prompt builder ─────────────────────────────────────────────────

function buildSystemPrompt(mode) {
    const base = `You are "AI Byte", a polite, helpful, and extremely friendly AI Coding Companion.
STRICT RULE: Only answer CODING and PROGRAMMING related questions. If a question is not about code, software engineering, or technical concepts, politely decline and steer the user back to programming with a warm message.

Your mission is to be the best helping hand for coders. Use polite, encouraging, and friendly language. Treat the user with respect and warmth, like a senior developer helping a junior friend.

Core principles:
• Polite & Friendly Tone: Start with a warm greeting if appropriate. Use "please", "happy to help", and similar polite phrasing.
• Best in Coding: Provide clean, efficient, and well-explained code solutions. Quality of code is paramount.
• Minimalist Formatting: STRICTLY AVOID using double asterisks (\`**\`) for emphasis in your explanations. Use headers (\`###\`), lists, or backticks (\`code\`) to organize your response. Keep it clean and premium.
• Helpful Guidance: Explain *why* a solution works in a way that is easy to grasp.

File Targeting Logic:
- If analyzing, fixing, explaining, or optimizing existing code, ONLY use the \`codePatch\` or \`changedLines\` fields to modify the ACTIVE FILE.
- CRITICAL: If there is an ACTIVE FILE open, you MUST NOT use the \`newFile\` object under any circumstances. If the user asks for a completely new program, completely replace the active file's content by providing the new code via \`codePatch\`.
- If and ONLY if there is NO active file open (which is rare), you may output the code in the \`newFile\` object to suggest creating one.

Strict Language Validation (CRITICAL):
1. You MUST only provide code in the language of the ACTIVE FILE (e.g., if active file is .c, provide C code).
2. If the user explicitly asks for code in a DIFFERENT language than the ACTIVE FILE (e.g. asking for Python inside a .c file), OR if the terminal error output proves they wrote code in the wrong language (e.g. running "print('hi')" through a C compiler), you MUST:
   - Identify the mismatch.
   - Using the \`explanation\` field, politely tell the user: "It looks like you wrote [Wrong Language] code, but you are currently in a [Active Language] file. Please change the language using the dropdown menu at the top left first!"
   - DO NOT provide any code or \`codePatch\` for the wrong language.

• Encouraging Closing: Always end with a polite and motivating tip or a friendly "Happy coding!" message.

STRICT CONTEXT RULES:
1. You MUST only answer questions related to the ACTIVE FILE. 
2. If the student asks a general question, try to relate it back to the active code.
3. If there is NO active file, politely ask the student to open or create a file first.`;

    const modePrompts = {
        chat: `${base}

MODE: CHAT (Friendly Helper)
- Explain concepts simply, like a friend helping with homework.
- Strictly output code using \`codePatch\` to replace the active file.
- Suggest fun or useful things they can try next.`,

        fix: `${base}

MODE: FIX (Bug Squasher)
- Help them find the bug without making them feel bad.
- Use line-by-line diffs in "changedLines" to show the fix clearly.
- Explain what went wrong in very simple terms.`,

        explain: `${base}

MODE: EXPLAIN (Code Storyteller)
- Tell the story of what the code is doing step-by-step.
- Don't use heavy technical words; use simple analogies (like comparing a variable to a box).
- Encourage them that they are doing a great job writing code.`,

        optimize: `${base}

MODE: OPTIMIZE (Code Polisher)
- Show them how to make their code run faster or look cleaner.
- Explain *why* the new way is better in simple English.
- Always praise their original code first!`,

        feature: `${base}

MODE: ADD FEATURE (Builder Mode)
- Help them build the new thing they asked for.
- Make sure the new code fits nicely with what they already have.`,
    };

    return (modePrompts[mode] || modePrompts.chat) + `

RESPONSE FORMAT: You MUST respond in valid JSON format ONLY.
{
  "explanation": "Friendly, simple explanation without using ** stars.",
  "codePatch": "Corrected code for the ACTIVE FILE (if applicable)",
  "newFile": { "name": "filename.ext", "content": "Full content for a NEW file to be created" },
  "changedLines": [{ "line": 1, "type": "add|remove|change", "content": "line content" }],
  "suggestions": ["Friendly tip 1", "Encouraging tip 2"],
  "errorFix": "Simple fix summary (if applicable)"
}`;
}

// ─── User message builder ──────────────────────────────────────────────────

function buildUserMessage({ projectFiles, activeFile, userPrompt, terminalOutput }) {
    let message = '';

    if (activeFile) {
        const lines = (activeFile.content || '').split('\n');
        const numberedCode = lines.map((line, i) => `${i + 1} | ${line}`).join('\n');
        message += `=== ACTIVE FILE: ${activeFile.name} (${activeFile.language}) ===\n`;
        message += `Total lines: ${lines.length}\n`;
        message += `\`\`\`${activeFile.language}\n${numberedCode}\n\`\`\`\n\n`;
    }

    if (projectFiles && projectFiles.length > 1) {
        const others = projectFiles.filter(f => f.name !== activeFile?.name).slice(0, 5);
        if (others.length > 0) {
            message += `=== OTHER PROJECT FILES ===\n`;
            others.forEach(f => {
                const preview = f.content?.slice(0, 800) || '';
                message += `--- ${f.name} (${f.language}) ---\n\`\`\`${f.language}\n${preview}${f.content?.length > 800 ? '\n...(truncated)' : ''}\n\`\`\`\n`;
            });
            message += '\n';
        }
    }

    if (terminalOutput) {
        message += `=== TERMINAL OUTPUT / ERROR ===\n\`\`\`\n${terminalOutput}\n\`\`\`\n\n`;
    }

    message += `=== STUDENT'S QUESTION ===\n${userPrompt}`;

    // Inject file tree if available (not implemented in payload yet, but good to have placeholder)
    // For now we assume projectFiles contains flat list, but we can simulate tree if paths exist
    const fileList = projectFiles?.map(f => f.name).join('\n') || '';
    if (fileList) {
        message += `\n\n=== PROJECT FILE LIST ===\n${fileList}`;
    }

    return message;
}

// ─── Model dispatchers ─────────────────────────────────────────────────────

async function callDeepSeek(apiKey, baseURL, systemPrompt, userMessage) {
    console.log(`[AI Router] Calling DeepSeek at ${baseURL}`);

    const response = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 402 || errText.includes('Insufficient Balance')) {
            throw new Error('DeepSeek: Insufficient balance. Add credits at platform.deepseek.com');
        }
        if (response.status === 401) {
            throw new Error('DeepSeek: Invalid API key.');
        }
        throw new Error(`DeepSeek error (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
}

async function callOllama(ollamaUrl, modelName, systemPrompt, userMessage) {
    console.log(`[AI Router] Calling Ollama at ${ollamaUrl} with model ${modelName}`);

    // Health check
    try {
        const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!ping.ok) throw new Error(`Ollama not responding at ${ollamaUrl}`);
        const tagsData = await ping.json();
        const models = tagsData.models || [];
        const found = models.some(m => m.name === modelName || m.name.startsWith(modelName.split(':')[0]));
        if (!found) {
            const available = models.map(m => m.name).join(', ') || 'none';
            console.warn(`[AI Router] Model "${modelName}" not found in local Ollama tags. Available: ${available}. (Continuing anyway...)`);
        }
    } catch (err) {
        if (err.message.includes('Ollama')) {
            console.warn(`[AI Router] Ollama health check failed: ${err.message}. (Continuing anyway...)`);
        } else {
            console.warn(`[AI Router] Cannot connect to Ollama at ${ollamaUrl}. (Continuing anyway...)`);
        }
    }

    const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            stream: false,
            format: 'json',
        }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data = await response.json();
    return data.message?.content || '{}';
}

// ─── Main router ───────────────────────────────────────────────────────────

export async function routeAiRequest({ projectFiles, activeFile, userPrompt, terminalOutput, selectedModel, mode }) {
    const systemPrompt = buildSystemPrompt(mode || 'chat');
    const userMessage = buildUserMessage({ projectFiles, activeFile, userPrompt, terminalOutput });
    const keys = getKeys();
    const hasDeepSeek = keys.DEEPSEEK_API_KEY.length > 5;

    console.log('[AI Router] Request:', { mode, selectedModel, hasDeepSeek, ollamaModel: keys.OLLAMA_MODEL });

    let rawContent;
    let usedModel = 'unknown';
    const errors = [];

    // Determine which model to use for Ollama
    const targetModel = selectedModel || keys.OLLAMA_MODEL;

    // DEFAULT: Try Ollama FIRST
    try {
        console.log(`[AI Router] Trying Ollama with model: ${targetModel}...`);
        rawContent = await callOllama(keys.OLLAMA_URL, targetModel, systemPrompt, userMessage);
        usedModel = `Ollama (${targetModel})`;
        console.log('[AI Router] ✓ Ollama success');
    } catch (err) {
        console.warn('[AI Router] ✗ Ollama failed:', err.message);
        errors.push(err.message);
    }

    // FALLBACK: Try DeepSeek if Ollama failed
    if (!rawContent && hasDeepSeek) {
        try {
            console.log('[AI Router] Trying DeepSeek (fallback)...');
            rawContent = await callDeepSeek(keys.DEEPSEEK_API_KEY, keys.DEEPSEEK_BASE_URL, systemPrompt, userMessage);
            usedModel = 'DeepSeek (fallback)';
            console.log('[AI Router] ✓ DeepSeek success');
        } catch (err) {
            console.warn('[AI Router] ✗ DeepSeek failed:', err.message);
            errors.push(err.message);
        }
    }

    if (!rawContent) {
        const errorList = errors.map(e => `• ${e}`).join('\n');
        throw new Error(`AI model "gpt-oss:120b-cloud" failed to respond. Please ensure Ollama is running and the model is pulled.\n\nErrors:\n${errorList}`);
    }

    // Parse response — handle various model output formats
    let parsed;
    try {
        // Trim whitespace and try direct parse first
        const trimmed = rawContent.trim();
        parsed = JSON.parse(trimmed);
    } catch (e1) {
        // Try extracting JSON from markdown code blocks (```json ... ```)
        try {
            const jsonBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
            if (jsonBlockMatch) {
                parsed = JSON.parse(jsonBlockMatch[1].trim());
            } else {
                // Try finding the first { ... } block
                const braceMatch = rawContent.match(/\{[\s\S]*\}/);
                if (braceMatch) {
                    parsed = JSON.parse(braceMatch[0]);
                } else {
                    throw new Error('No JSON found');
                }
            }
        } catch (e2) {
            console.warn('[AI Router] JSON parse failed, using raw text:', e2.message);
            console.warn('[AI Router] Raw content (first 500 chars):', rawContent.slice(0, 500));
            parsed = { explanation: rawContent, codePatch: null, changedLines: [], errorFix: null, suggestedFiles: [] };
        }
    }

    // If explanation itself is JSON string (double-encoded), unwrap it
    if (typeof parsed.explanation === 'string' && parsed.explanation.startsWith('{')) {
        try {
            const inner = JSON.parse(parsed.explanation);
            if (inner.explanation) parsed = inner;
        } catch { /* keep original */ }
    }

    return {
        explanation: parsed.explanation || '',
        codePatch: parsed.codePatch || null,
        newFile: parsed.newFile || null,
        changedLines: parsed.changedLines || [],
        suggestions: parsed.suggestions || [],
        errorFix: parsed.errorFix || null,
        model: usedModel,
    };
}
