import { useState, useRef, useEffect, useCallback } from 'react';
import {
    ChevronDown, MessageSquare, Wrench, BookOpen, Zap,
    Send, Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIdeStore, type AiMode, type AiModel } from '../../stores/ideStore';
import DiffViewer from './DiffViewer';
import api from '../../lib/api';

const MODELS: AiModel[] = [
    'gpt-oss:120b-cloud',
    'DeepSeek-v3.1:671b-cloud',
];

const MODES: { id: AiMode; icon: React.FC<any>; label: string; color: string; desc: string }[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat', color: 'text-blue-400', desc: 'Ask anything about your code' },
    { id: 'fix', icon: Wrench, label: 'Fix', color: 'text-red-400', desc: 'Debug and fix errors' },
    { id: 'explain', icon: BookOpen, label: 'Explain', color: 'text-green-400', desc: 'Understand your code line by line' },
    { id: 'optimize', icon: Zap, label: 'Optimize', color: 'text-yellow-400', desc: 'Improve performance & best practices' },
];

interface AIAssistantPanelProps {
    files: any[];
    activeFile: any | null;
    onSaveFile?: (fileId: string, content: string) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    codePatch?: string | null;
    errorFix?: string | null;
    changedLines?: any[];
    model?: string;
}

export default function AIAssistantPanel({ files, activeFile, onSaveFile }: AIAssistantPanelProps) {
    const { activeProjectId, selectedModel, setSelectedModel, aiMode, setAiMode, terminalOutput } = useIdeStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [patchTargetId, setPatchTargetId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for Ctrl+K inline AI trigger
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            if (e.detail?.selection) {
                setPrompt(`Explain this code:\n\`\`\`\n${e.detail.selection}\n\`\`\``);
                setAiMode('explain');
                textareaRef.current?.focus();
            }
        };
        window.addEventListener('ide:ai-inline', handler as EventListener);
        return () => window.removeEventListener('ide:ai-inline', handler as EventListener);
    }, [setAiMode]);

    // Load history on mount or when mode/project changes
    useEffect(() => {
        if (!activeProjectId) return;
        setMessages([]); // Clear previous messages while loading

        api.get(`/ide/projects/${activeProjectId}/history?mode=${aiMode}`)
            .then(({ data }) => {
                if (data.messages) {
                    setMessages(data.messages.map((m: any) => ({
                        id: m._id,
                        role: m.role,
                        content: m.content,
                        model: m.model,
                    })));
                } else {
                    setMessages([]);
                }
            })
            .catch(err => console.error('Failed to load chat history', err));
    }, [activeProjectId, aiMode]);

    const handleSend = useCallback(async (
        overridePrompt?: string,
        overrideMode?: AiMode,
    ) => {
        const userPrompt = overridePrompt || prompt;
        const mode = overrideMode || aiMode;
        if (!userPrompt.trim() || isLoading) return;

        const userMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: userPrompt,
        };
        setMessages((prev) => [...prev, userMsg]);
        setPrompt('');
        setIsLoading(true);

        // Save user message to history
        if (activeProjectId) {
            api.post(`/ide/projects/${activeProjectId}/history`, {
                role: userMsg.role,
                content: userMsg.content,
                mode: mode, // Save with current mode
            }).catch(e => console.error('Failed to save user message', e));
        }

        try {
            const { data } = await api.post('/ai-router', {
                projectFiles: files.slice(0, 10).map((f) => ({
                    name: f.name,
                    language: f.language,
                    content: f.content?.slice(0, 3000),
                })),
                activeFile: activeFile ? {
                    name: activeFile.name,
                    language: activeFile.language,
                    content: activeFile.content,
                } : null,
                userPrompt,
                terminalOutput: terminalOutput?.slice(-3000) || '',
                selectedModel,
                mode,
            });

            const assistantMsg: Message = {
                id: `msg-${Date.now() + 1}`,
                role: 'assistant',
                content: data.explanation || 'No explanation provided.',
                codePatch: data.codePatch || null,
                errorFix: data.errorFix || null,
                changedLines: data.changedLines || [],
                model: data.model || selectedModel,
            };
            setMessages((prev) => [...prev, assistantMsg]);

            // Save assistant message to history
            if (activeProjectId) {
                api.post(`/ide/projects/${activeProjectId}/history`, {
                    role: assistantMsg.role,
                    content: assistantMsg.content,
                    model: assistantMsg.model,
                    mode: mode, // Save with current mode
                }).catch(e => console.error('Failed to save assistant message', e));
            }
        } catch (err: any) {
            const errorMsg = err?.response?.data?.error?.message || err.message || 'AI service unavailable';
            const isOllamaModel = !selectedModel?.toLowerCase().includes('deepseek');
            const hint = isOllamaModel
                ? `Make sure **Ollama** is running with the \`${selectedModel}\` model.`
                : `Make sure your **DeepSeek API key** is valid in \`.env\` (DEEPSEEK_API_KEY).`;
            setMessages((prev) => [...prev, {
                id: `err-${Date.now()}`,
                role: 'assistant',
                content: `⚠️ **Network Error**\n\n${errorMsg}\n\n💡 ${hint}`,
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aiMode, isLoading, files, activeFile, terminalOutput, selectedModel, activeProjectId]);

    // Auto-fix on terminal error
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            const { errorOutput } = e.detail;
            setPrompt(`Fix this error:\n${errorOutput}`);
            setAiMode('fix');
            handleSend(
                `Fix this runtime error:\n\`\`\`\n${errorOutput}\n\`\`\``,
                'fix'
            );
        };
        window.addEventListener('terminal:error', handler as EventListener);
        return () => window.removeEventListener('terminal:error', handler as EventListener);
    }, [activeFile, files, handleSend, setAiMode]);

    const handleApplyPatch = (msgId: string, patch: string) => {
        const { activeTabId, updateTabContent } = useIdeStore.getState();
        if (!activeTabId || !patch) return;

        setPatchTargetId(msgId);

        // Extract code from backticks if present
        let cleanPatch = patch;
        const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)\n```/g;
        const matches = [...patch.matchAll(codeBlockRegex)];
        if (matches.length > 0) {
            cleanPatch = matches[0][1];
        }

        setTimeout(() => {
            updateTabContent(activeTabId, cleanPatch);
            setPatchTargetId(null);
        }, 600);
    };

    const activeMode = MODES.find(m => m.id === aiMode);

    return (
        <div className="flex h-full flex-col bg-[#0d1425] text-white">
            {/* Header: Model Selector */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0a0f1e]/50 backdrop-blur-md sticky top-0 z-20">
                <div className="relative flex-1">
                    <button
                        onClick={() => setShowModelDropdown((v) => !v)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400 transition-all hover:bg-white/10 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span>{selectedModel}</span>
                        </div>
                        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-500 transition-transform', showModelDropdown && 'rotate-180')} />
                    </button>

                    {showModelDropdown && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-white/10 bg-[#1e293b] shadow-2xl backdrop-blur-xl p-1.5">
                            {MODELS.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { setSelectedModel(m); setShowModelDropdown(false); }}
                                    className={cn(
                                        'flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-colors',
                                        m === selectedModel ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <div className={cn('h-1.5 w-1.5 rounded-full', m === selectedModel ? 'bg-white' : 'bg-slate-700')} />
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-1.5 flex-wrap p-3 border-b border-white/5 bg-[#0f172a]/30">
                {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = aiMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => setAiMode(mode.id)}
                            title={mode.desc}
                            className={cn(
                                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all',
                                isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/50'
                                    : 'bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300'
                            )}
                        >
                            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-indigo-400" : "text-slate-600")} />
                            {mode.label}
                        </button>
                    );
                })}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center py-16 px-6 animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full"></div>
                            <div className="relative h-24 w-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0d1425] border border-white/10 shadow-2xl rotate-3">
                                <div className="text-5xl drop-shadow-lg">🤖</div>
                            </div>
                        </div>
                        <h3 className="text-[13px] font-black text-white mb-2 uppercase tracking-[0.2em] italic">AI Tutor Ready</h3>
                        <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mb-10">
                            Select a file to start editing, or ask me to help build a new feature.
                        </p>

                        <div className="grid grid-cols-1 gap-2.5 w-full max-w-[300px]">
                            {MODES.slice(0, 3).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setAiMode(m.id)}
                                    className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-left transition-all hover:bg-white/[0.07] hover:border-indigo-500/30 group"
                                >
                                    <div className={cn("p-2 rounded-xl transition-colors bg-white/5 shadow-sm group-hover:bg-white/10", m.color)}>
                                        <m.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black text-slate-200 group-hover:text-white transition-colors uppercase tracking-wider">{m.label}</div>
                                        <div className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors line-clamp-1">{m.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn('flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'items-end pl-8' : 'items-start pr-8')}>
                            <div
                                className={cn(
                                    'relative rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm',
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10'
                                        : 'bg-white/[0.03] text-slate-200 border border-white/5 rounded-tl-none'
                                )}
                            >
                                {msg.content && (
                                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5 text-xs text-slate-200">
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                )}

                                {msg.errorFix && (
                                    <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-indigo-300 text-[11px] flex items-start gap-2">
                                        <Wrench className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-black text-indigo-400 uppercase tracking-wider block mb-1">Recommended Fix</span>
                                            {msg.errorFix}
                                        </div>
                                    </div>
                                )}

                                {/* Show which model responded */}
                                {msg.model && msg.role === 'assistant' && (
                                    <div className="mt-3 text-[9px] font-bold text-slate-600 border-t border-white/5 pt-2 flex items-center gap-1.5 uppercase tracking-widest">
                                        <div className="h-1 w-1 rounded-full bg-indigo-500/50" />
                                        {msg.model}
                                    </div>
                                )}
                            </div>

                            {msg.codePatch && (
                                <div className="w-full mt-1">
                                    <DiffViewer
                                        patch={msg.codePatch}
                                        onApply={() => handleApplyPatch(msg.id, msg.codePatch!)}
                                        isApplying={patchTargetId === msg.id}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/5 p-4 bg-[#0a0f1e]/90 backdrop-blur-2xl">
                {/* Active file indicator */}
                {activeFile && (
                    <div className="mb-3 px-2 flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                        READING <span className="text-slate-300">{activeFile.name}</span>
                        <span className="text-slate-700 italic">({activeFile.language})</span>
                    </div>
                )}

                <div className="relative group/input">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={`Ask AI... (Enter to send)`}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] pl-4 pr-12 py-3.5 text-xs text-white placeholder-slate-600 transition-all focus:border-indigo-500 focus:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar max-h-48"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !prompt.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <div className="mt-3 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500 mr-2">Ctrl+K</span> Inline AI • {activeMode?.label || 'CHAT'} Mode
                </div>
            </div>
        </div>
    );
}
