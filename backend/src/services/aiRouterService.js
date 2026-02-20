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
    const base = `You are a powerful AI coding specialist embedded in a student's IDE.
STRICT RULE: Only answer CODING and PROGRAMMING related questions. If a question is not about code, logic, or development, politely refuse and state your specialization.

Your goal is to give 100% ACCURATE, clean, and professional code. Zero mistakes are expected.
Explain concepts as a friendly mentor, but remain highly technical and precise.

Core principles:
• Guarantee RIGHT CODE ONLY. Test your logic mentally before responding.
• Maintain a very friendly environment for the student.
• Clean output: Do NOT use markdown stars (\`*\`) for emphasis unless absolutely necessary for readability. Keep it clean and orderly.
• Read and understand the student's code BEFORE responding.
• When a solution is provided, use standard code blocks and be precise.
• Point out both what's correct AND what needs improvement.`;

    const modePrompts = {
        chat: `${base}

MODE: CHAT (General Help)
- Answer clearly and concisely
- Reference specific line numbers from their code
- Provide code examples when helpful
- Suggest relevant concepts they should learn
- Guide step by step if they're stuck`,

        fix: `${base}

MODE: FIX (Debug & Fix Errors)
- Read the code and identify the exact bug
- Explain what caused the error in plain English
- Show the corrected code in codePatch
- Explain what you changed and WHY
- Suggest how to prevent this type of bug in the future
- Use the provided file structure to understand where files are located`,

        explain: `${base}

MODE: EXPLAIN (Code Explanation)
- Walk through the code LINE BY LINE or BLOCK BY BLOCK
- Explain what each part does using simple language
- Identify the overall purpose first, then dive into details
- Highlight patterns, algorithms, or data structures used
- Point out potential issues or improvements
- Rate the code quality and explain why`,

        optimize: `${base}

MODE: OPTIMIZE (Performance & Best Practices)
- FIRST: Check if the code is already optimized.
- If it works fine and is clean, say "Your code looks great! excellent work." and ask if they have specific concerns.
- ONLY suggest changes if there are clear performance issues or major anti-patterns.
- Analyze for performance issues (time/space complexity)
- Explain Big-O in simple terms when relevant
- Suggest more efficient algorithms or data structures
- Show the optimized version in codePatch
- Compare before/after with explanations
- Point out security concerns if any`,

        feature: `${base}

MODE: ADD FEATURE (New Functionality)
- Understand what the student wants to add
- Show how the feature fits into their existing code
- Provide complete implementation in codePatch
- Explain each new piece of code
- Follow the student's existing style`,
    };

    return (modePrompts[mode] || modePrompts.chat) + `

RESPONSE FORMAT: Always respond with valid JSON:
{
  "explanation": "Your detailed, student-friendly explanation (use markdown: **bold**, \`code\`, bullets)",
  "codePatch": "Complete corrected/improved code (or null if no code changes)",
  "changedLines": [{ "line": 1, "type": "add|remove|change", "content": "line content" }],
  "errorFix": "Short fix description (or null)",
  "suggestedFiles": [{ "name": "filename", "reason": "why relevant" }]
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
        throw new Error(`All AI services failed:\n${errorList}`);
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
        changedLines: parsed.changedLines || [],
        errorFix: parsed.errorFix || null,
        suggestedFiles: parsed.suggestedFiles || [],
        model: usedModel,
    };
}
