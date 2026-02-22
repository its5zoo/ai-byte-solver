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

    useEffect(() => {
        const handler = () => {
            handleRun();
        };
        window.addEventListener('ide:run', handler);
        return () => window.removeEventListener('ide:run', handler);
    }, [handleRun]);

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
        <div className="flex h-full flex-col bg-[#030712] font-mono border-t ide-border">
            {/* Toolbar */}
            <div className="flex items-center gap-3 border-b ide-border px-4 py-2 bg-[#0a0f1e]/80 shrink-0">
                <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]')} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isConnected ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex-1" />

                {!isRunning ? (
                    <button
                        onClick={handleRun}
                        disabled={!activeFile || !isConnected}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:opacity-20 shadow-lg shadow-indigo-600/20"
                    >
                        <Play className="h-3.5 w-3.5 fill-current" /> Run
                    </button>
                ) : (
                    <button
                        onClick={handleKill}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
                    >
                        <Square className="h-3.5 w-3.5 fill-current" /> Stop
                    </button>
                )}

                <button
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                    title="Clear Terminal"
                >
                    <Trash2 className="h-4 w-4" />
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
                <div className="flex items-center gap-3 border-t ide-border bg-[#0a0f1e]/90 backdrop-blur-xl px-4 py-2.5 shrink-0">
                    <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Input</span>
                    <div className="relative flex-1 group">
                        <input
                            ref={inputRef}
                            type="text"
                            value={stdinInput}
                            onChange={(e) => setStdinInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendInput(); }}
                            placeholder="Type here..."
                            className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none border border-white/5 focus:border-indigo-500/30 transition-all"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleSendInput}
                        disabled={!stdinInput}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30"
                    >
                        <CornerDownLeft className="h-3.5 w-3.5" /> Send
                    </button>
                </div>
            )}
        </div>
    );
}
