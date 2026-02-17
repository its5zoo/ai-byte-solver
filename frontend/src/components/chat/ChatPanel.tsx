import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, HelpCircle } from 'lucide-react';
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
  { id: 'quick', label: 'Quick' },
  { id: 'steps', label: 'Step-by-Step' },
  { id: 'example', label: 'Example-Based' },
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/80 dark:bg-slate-950/50">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          {error && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              {onDismissError && (
                <button type="button" onClick={onDismissError} className="shrink-0 text-red-600 hover:text-red-800 dark:text-red-400">
                  Dismiss
                </button>
              )}
            </div>
          )}
          {(!sessionId || showWelcome) && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ask your doubt
              </h2>
              <p className="mt-2 max-w-md text-base text-slate-600 dark:text-slate-300">
                Ask any doubt from your syllabus. I'll explain step by step.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTION_CHIPS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSuggestionClick(label); }}
                    disabled={isLoading}
                    className="rounded-full border-2 border-violet-500/50 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-500/20 dark:border-violet-400/50 dark:text-violet-300 dark:hover:bg-violet-500/30"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-6 pb-4">
              {messages.map((m) => (
                <MessageBubble key={m._id} message={m} />
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="animate-pulse text-sm text-slate-600 dark:text-slate-400">Thinking</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-2xl space-y-3">
          {sessionId && (
            <div className="flex flex-wrap gap-2">
              {RESPONSE_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedChip(chip.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    selectedChip === chip.id
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-violet-600 dark:hover:bg-violet-900/30'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-4 pr-2 dark:border-slate-700 dark:bg-slate-800/50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(undefined, input.trim() || undefined);
                  }
                }}
                placeholder="Ask your doubt here..."
                rows={1}
                disabled={isLoading}
                className="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              />
              <Button
                type="button"
                onClick={() => handleSubmit(undefined)}
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-full bg-violet-600 text-white shadow-md hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Link
              to={sessionId ? `/chat/${sessionId}/quiz` : '/chat'}
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-medium text-white shadow-md shadow-violet-500/30 transition hover:bg-violet-700"
            >
              <HelpCircle className="h-5 w-5" />
              {sessionId ? 'Start Quiz' : 'Start chat to quiz'}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
