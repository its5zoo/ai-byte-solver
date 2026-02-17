import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, HelpCircle, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import MessageBubble from './MessageBubble';
import { cn } from '../../lib/utils';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const SUGGESTION_CHIPS = [
  'Explain with steps',
  'Give short answer',
  'Show formulas',
  'Summarize this topic',
];

const RESPONSE_CHIPS = [
  { id: 'quick', label: 'Quick', icon: '⚡' },
  { id: 'steps', label: 'Step-by-Step', icon: '📝' },
  { id: 'example', label: 'Example-Based', icon: '💡' },
];

interface ChatPanelProps {
  sessionId: string | null;
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  mode: 'syllabus' | 'open';
}

export default function ChatPanel({
  sessionId,
  messages,
  onSend,
  isLoading,
  error,
  onDismissError,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [selectedChip, setSelectedChip] = useState<string>('quick');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const toSend = (text ?? input).trim();
    if (!toSend || isLoading) return;
    try {
      await onSend(toSend);
      if (!text) setInput('');
    } catch (_) {
      // Error shown via parent error state
    }
  };

  const handleSuggestionClick = (label: string) => {
    if (isLoading) return;
    handleSubmit(undefined, label);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Messages area */}
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {/* Error banner */}
          {error && (
            <div className="mb-6 animate-fade-in-down flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="shrink-0 rounded-lg px-3 py-1 text-sm text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Welcome screen */}
          {(!sessionId || showWelcome) && (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in-up">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/30">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Ask Your Doubt
              </h2>
              <p className="max-w-md text-base text-slate-600 dark:text-slate-300 mb-8">
                I'm here to help you understand concepts, solve problems, and ace your exams.
                Ask me anything academic!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTION_CHIPS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(label);
                    }}
                    disabled={isLoading}
                    className="group rounded-full border-2 border-violet-500/50 bg-violet-500/5 px-5 py-2.5 text-sm font-medium text-violet-700 transition-all hover:border-violet-500 hover:bg-violet-500/10 hover:scale-105 active:scale-95 dark:border-violet-400/50 dark:text-violet-300 dark:hover:bg-violet-500/20 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m._id} message={m} />
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mt-6 animate-fade-in-up">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 ring-2 ring-violet-500/10 dark:from-violet-900/40 dark:to-violet-800/40">
                <Loader2 className="h-5 w-5 animate-spin text-violet-700 dark:text-violet-300" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Thinking</span>
                <span className="animate-bounce text-violet-600 dark:text-violet-400">.</span>
                <span className="animate-bounce text-violet-600 dark:text-violet-400" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce text-violet-600 dark:text-violet-400" style={{ animationDelay: '0.2s' }}>.</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white/90 backdrop-blur-lg px-4 py-4 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Response style chips */}
          {sessionId && messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {RESPONSE_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedChip(chip.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all',
                    selectedChip === chip.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 scale-105'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-violet-600 dark:hover:bg-violet-900/30'
                  )}
                >
                  <span className="mr-1.5">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input and send button */}
          <div className="flex gap-3">
            <div className="flex flex-1 items-end gap-2 rounded-2xl border border-slate-300 bg-slate-50/80 py-2 pl-5 pr-2 dark:border-slate-700 dark:bg-slate-800/50 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(undefined, input.trim() || undefined);
                  }
                }}
                placeholder="Ask your doubt here... (Shift+Enter for new line)"
                rows={1}
                disabled={isLoading}
                className="max-h-32 flex-1 resize-none bg-transparent text-base text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400 custom-scrollbar"
              />
              <Button
                type="button"
                onClick={() => handleSubmit(undefined)}
                disabled={isLoading || !input.trim()}
                variant="primary"
                size="sm"
                className="h-10 w-10 shrink-0 rounded-full p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Quiz button */}
            <Link
              to={sessionId ? `/chat/${sessionId}/quiz` : '/chat'}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3 font-medium text-white shadow-md shadow-violet-500/30 transition-all hover:shadow-lg hover:shadow-violet-500/40 hover:scale-105 active:scale-95',
                !sessionId && 'opacity-50 pointer-events-none'
              )}
            >
              <HelpCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Start Quiz</span>
            </Link>
          </div>

          {/* Helper text */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            AI may make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
