/**
 * Terminal WebSocket Service
 * Uses socket.io to provide real-time code execution via child_process.
 * Supports node, python, cpp, c, and java execution with streaming output.
 * Supports stdin input from the user.
 */
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import jwt from 'jsonwebtoken';

const ALLOWED_LANGUAGES = ['javascript', 'python', 'typescript', 'cpp', 'c', 'java'];
const TIMEOUT_MS = 30000; // 30 second execution timeout

export function initTerminalWs(httpServer) {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
    ];

    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/terminal',
    });

    // Auth middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Authentication required'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-prod');
            socket.userId = decoded.userId;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Terminal WS] Client connected: ${socket.id} (user: ${socket.userId})`);
        let activeProcess = null;
        let timeoutHandle = null;

        // ─── Send user input to stdin ──────────────────────────────────
        socket.on('input', (data) => {
            if (activeProcess && activeProcess.stdin && !activeProcess.stdin.destroyed) {
                try {
                    activeProcess.stdin.write(data);
                } catch (err) {
                    console.warn('[Terminal WS] stdin write failed:', err.message);
                }
            }
        });

        // ─── Run code ──────────────────────────────────────────────────
        socket.on('run', ({ content, language, filename }) => {
            // Kill any running process first
            if (activeProcess) {
                activeProcess.kill('SIGTERM');
                activeProcess = null;
            }
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }

            if (!ALLOWED_LANGUAGES.includes(language)) {
                socket.emit('output', { type: 'error', data: `Language '${language}' is not supported.\n` });
                return;
            }

            if (!content?.trim()) {
                socket.emit('output', { type: 'error', data: 'No code to execute.\n' });
                return;
            }

            // Use a dedicated temp dir to avoid --watch triggering on project folder
            let sandboxDir;
            try {
                sandboxDir = mkdtempSync(join(tmpdir(), 'ide_sandbox_'));
            } catch {
                sandboxDir = tmpdir();
            }

            // Determine file extension
            let ext = 'js';
            if (language === 'python') ext = 'py';
            else if (language === 'cpp') ext = 'cpp';
            else if (language === 'c') ext = 'c';
            else if (language === 'java') ext = 'java';

            const tempId = `run_${Date.now()}`;
            const tempFile = join(sandboxDir, `${tempId}.${ext}`);

            try {
                writeFileSync(tempFile, content, 'utf-8');
            } catch (err) {
                socket.emit('output', { type: 'error', data: `Failed to write temp file: ${err.message}\n` });
                return;
            }

            socket.emit('output', { type: 'info', data: `▶ Running ${filename || `code.${ext}`}...\n` });

            // Build the command based on language
            if (language === 'cpp') {
                const outFile = join(sandboxDir, `${tempId}.exe`);
                const fullCmd = `g++ "${tempFile}" -o "${outFile}" && "${outFile}"`;
                runProcess(socket, 'powershell', ['-Command', fullCmd], tempFile, language, content, () => {
                    try { if (existsSync(outFile)) unlinkSync(outFile); } catch { }
                });
            } else if (language === 'c') {
                const outFile = join(sandboxDir, `${tempId}.exe`);
                const fullCmd = `gcc "${tempFile}" -o "${outFile}" && "${outFile}"`;
                runProcess(socket, 'powershell', ['-Command', fullCmd], tempFile, language, content, () => {
                    try { if (existsSync(outFile)) unlinkSync(outFile); } catch { }
                });
            } else if (language === 'java') {
                const fullCmd = `javac "${tempFile}" && java -cp "${sandboxDir}" ${tempId}`;
                runProcess(socket, 'powershell', ['-Command', fullCmd], tempFile, language, content);
            } else if (language === 'python') {
                runProcess(socket, 'python', [tempFile], tempFile, language, content);
            } else {
                // javascript / typescript
                runProcess(socket, 'node', [tempFile], tempFile, language, content);
            }
        });

        function runProcess(sock, cmd, args, tempFile, language, content, cleanupCallback) {
            let errorOutput = '';

            try {
                activeProcess = spawn(cmd, args, {
                    env: { ...process.env, NODE_PATH: undefined },
                    shell: cmd === 'powershell',
                    stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr all piped
                });

                activeProcess.stdout.on('data', (data) => {
                    sock.emit('output', { type: 'stdout', data: data.toString() });
                });

                activeProcess.stderr.on('data', (data) => {
                    const text = data.toString();
                    errorOutput += text;
                    sock.emit('output', { type: 'stderr', data: text });
                });

                activeProcess.on('close', (code) => {
                    // Cleanup
                    try { if (existsSync(tempFile)) unlinkSync(tempFile); } catch { }
                    if (cleanupCallback) cleanupCallback();
                    if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }

                    if (code === 0) {
                        sock.emit('output', { type: 'info', data: `\n✓ Process exited successfully\n` });
                        sock.emit('run:complete', { success: true });
                    } else {
                        sock.emit('output', { type: 'error', data: `\n✗ Process exited with code ${code}\n` });
                        if (errorOutput) {
                            sock.emit('run:error', {
                                exitCode: code,
                                errorOutput,
                                language,
                                code: content,
                            });
                        }
                    }
                    activeProcess = null;
                });

                activeProcess.on('error', (err) => {
                    try { if (existsSync(tempFile)) unlinkSync(tempFile); } catch { }
                    if (cleanupCallback) cleanupCallback();
                    if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }

                    let msg = `\n✗ Failed to start process: ${err.message}\n`;
                    if (err.code === 'ENOENT') {
                        msg = `\n✗ Runtime '${cmd}' not found. Make sure it is installed.\n`;
                    }
                    sock.emit('output', { type: 'error', data: msg });
                    sock.emit('run:complete', { success: false });
                    activeProcess = null;
                });

                // Timeout
                timeoutHandle = setTimeout(() => {
                    if (activeProcess) {
                        activeProcess.kill('SIGTERM');
                        sock.emit('output', { type: 'error', data: '\n⚠ Execution timed out (30s limit)\n' });
                        sock.emit('run:complete', { success: false });
                        activeProcess = null;
                    }
                }, TIMEOUT_MS);

            } catch (spawnErr) {
                sock.emit('output', { type: 'error', data: `\n✗ Spawn error: ${spawnErr.message}\n` });
                sock.emit('run:complete', { success: false });
            }
        }

        socket.on('kill', () => {
            if (activeProcess) {
                activeProcess.kill('SIGTERM');
                activeProcess = null;
                if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
                socket.emit('output', { type: 'info', data: '\n⚠ Process killed by user.\n' });
                socket.emit('run:complete', { success: false });
            }
        });

        socket.on('disconnect', () => {
            if (activeProcess) {
                activeProcess.kill('SIGTERM');
                activeProcess = null;
            }
            if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
            console.log(`[Terminal WS] Client disconnected: ${socket.id}`);
        });
    });

    console.log('[Terminal WS] WebSocket server initialized on path /terminal');
    return io;
}
