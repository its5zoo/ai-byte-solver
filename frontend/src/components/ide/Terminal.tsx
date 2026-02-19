import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Play, Square, Trash2, Loader2, CornerDownLeft } from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface TerminalProps {
    activeFile: { _id: string; name: string; content: string; language: string } | null;
}

interface OutputLine {
    id: string;
    type: 'stdout' | 'stderr' | 'error' | 'info' | 'stdin';
    data: string;
}

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export default function Terminal({ activeFile }: TerminalProps) {
    const { token } = useAuthStore();
    const { appendTerminalOutput, clearTerminalOutput } = useIdeStore();
    const [lines, setLines] = useState<OutputLine[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [stdinInput, setStdinInput] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const addLine = useCallback((type: OutputLine['type'], data: string) => {
        setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, data }]);
        appendTerminalOutput(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, [appendTerminalOutput]);

    // Build socket connection
    useEffect(() => {
        if (!token) return;

        const socket = io(BACKEND_URL, {
            path: '/terminal',
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            setIsConnected(true);
            addLine('info', '✓ Terminal connected\n');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setIsRunning(false);
            addLine('info', '⚠ Terminal disconnected\n');
        });

        socket.on('output', ({ type, data }: { type: string; data: string }) => {
            addLine(type as OutputLine['type'], data);

            // If we're running and get a timeout or fatal sandbox error, tell the AI
            if (isRunning && (data.includes('timed out') || data.includes('limit reached'))) {
                window.dispatchEvent(new CustomEvent('terminal:error', {
                    detail: { errorOutput: data, language: activeFile?.language, code: '' }
                }));
            }
        });

        socket.on('run:complete', () => {
            setIsRunning(false);
        });

        socket.on('run:error', (payload: { exitCode: number; errorOutput: string; language: string; code: string }) => {
            setIsRunning(false);
            window.dispatchEvent(new CustomEvent('terminal:error', { detail: payload }));
            addLine('info', '\n🤖 Sending error to AI for auto-fix…\n');
        });

        socket.on('connect_error', (err) => {
            addLine('error', `Connection error: ${err.message}\n`);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, addLine]);

    const handleRun = useCallback(() => {
        if (!socketRef.current || !activeFile || isRunning) return;

        const content = useIdeStore.getState().openTabs.find(
            (t) => t.fileId === activeFile._id
        )?.content ?? activeFile.content;

        setIsRunning(true);
        addLine('info', `\n▶ Running ${activeFile.name}…\n`);

        socketRef.current.emit('run', {
            content,
            language: activeFile.language,
            filename: activeFile.name,
        });

        // Focus the input field so user can type input immediately
        setTimeout(() => inputRef.current?.focus(), 200);
    }, [activeFile, isRunning, addLine]);

    const handleKill = useCallback(() => {
        if (!socketRef.current || !isRunning) return;
        socketRef.current.emit('kill');
        setIsRunning(false);
    }, [isRunning]);

    const handleClear = useCallback(() => {
        setLines([]);
        clearTerminalOutput();
    }, [clearTerminalOutput]);

    // Send stdin input to the running process
    const handleSendInput = useCallback(() => {
        if (!socketRef.current || !isRunning || !stdinInput) return;
        // Show what user typed
        addLine('stdin', `> ${stdinInput}\n`);
        // Send to backend (with newline so the program's readline gets it)
        socketRef.current.emit('input', stdinInput + '\n');
        setStdinInput('');
        inputRef.current?.focus();
    }, [isRunning, stdinInput, addLine]);

    const getLineColor = (type: OutputLine['type']) => {
        switch (type) {
            case 'stderr': return 'text-red-400';
            case 'error': return 'text-red-500';
            case 'info': return 'text-blue-400';
            case 'stdin': return 'text-yellow-400';
            default: return 'text-slate-200';
        }
    };

    return (
        <div className="flex h-full flex-col bg-[#030712] font-mono">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-[#1e293b] px-3 py-1.5 bg-[#0f172a] shrink-0">
                <div className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-400' : 'bg-red-400')} />
                <span className="text-[10px] text-slate-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
                <div className="flex-1" />

                {!isRunning ? (
                    <button
                        onClick={handleRun}
                        disabled={!activeFile || !isConnected}
                        className="flex items-center gap-1.5 rounded bg-green-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-green-600 disabled:opacity-40"
                    >
                        <Play className="h-3 w-3" /> Run
                    </button>
                ) : (
                    <button
                        onClick={handleKill}
                        className="flex items-center gap-1.5 rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                        <Square className="h-3 w-3" /> Stop
                    </button>
                )}

                <button
                    onClick={handleClear}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {lines.length === 0 && (
                    <p className="text-xs text-slate-600 italic">
                        {isConnected
                            ? 'Click RUN to execute the current file…'
                            : 'Connecting to terminal…'}
                    </p>
                )}
                {lines.map((line) => (
                    <span
                        key={line.id}
                        className={cn('block whitespace-pre-wrap text-xs leading-relaxed', getLineColor(line.type))}
                    >
                        {line.data}
                    </span>
                ))}
                {isRunning && lines.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Running… (type input below)</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Stdin input bar — visible when a process is running */}
            {isRunning && (
                <div className="flex items-center gap-2 border-t border-[#1e293b] bg-[#0a0f1e] px-3 py-1.5 shrink-0">
                    <span className="text-[10px] text-yellow-500 font-bold">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={stdinInput}
                        onChange={(e) => setStdinInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendInput(); }}
                        placeholder="Type input here and press Enter…"
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={handleSendInput}
                        disabled={!stdinInput}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors disabled:opacity-30"
                    >
                        <CornerDownLeft className="h-3 w-3" /> Send
                    </button>
                </div>
            )}
        </div>
    );
}
