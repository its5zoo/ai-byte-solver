import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyOllama() {
    const url = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'deepseek-v3.1:671b-cloud';

    console.log(`--- Ollama Test Case ---`);
    console.log(`URL: ${url}`);
    console.log(`Model: ${model}`);

    try {
        console.log('Sending chat request...');
        const res = await fetch(`${url}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Say "Working!"' }],
                stream: false
            })
        });

        if (!res.ok) {
            console.error(`HTTP Error: ${res.status}`);
            console.log(await res.text());
        } else {
            const data = await res.json();
            console.log('Response:', data.message?.content);
            console.log('\nSUCCESS: DeepSeek is responding through Ollama!');
        }
    } catch (err) {
        console.error('Connection failed:', err.message);
        console.log('\nNOTE: If this fails, ensure your model name exactly matches what is listed in "ollama list" or that your proxy handles this name.');
    }
}

verifyOllama();
