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

interface ChatPanelProps {
  sessionId: string | null;
  messages: Message[];
  onSend: (content: string, aiProvider?: 'ollama' | 'gemini') => Promise<void>;
  isLoading?: boolean;
  mode: 'syllabus' | 'open';
  aiProvider?: 'ollama' | 'gemini';
}

const RESPONSE_CHIPS = [
  { id: 'quick', label: 'Quick' },
  { id: 'steps', label: 'Step-by-Step' },
  { id: 'example', label: 'Example-Based' },
];

export default function ChatPanel({
  sessionId,
  messages,
  onSend,
  isLoading,
  aiProvider = 'ollama',
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [selectedChip, setSelectedChip] = useState<string>('quick');
  const [selectedMode, setSelectedMode] = useState<'ollama' | 'gemini'>(aiProvider);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) setSelectedMode(aiProvider);
  }, [sessionId, aiProvider]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const toSend = (text ?? input).trim();
    if (!toSend || isLoading) return;
    if (!sessionId) {
      await onSend(toSend, selectedMode);
    } else {
      await onSend(toSend);
    }
    if (!text) setInput('');
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950/50">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          {(!sessionId || showWelcome) && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Ask your doubt
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Ask any doubt from your syllabus. I'll explain step by step.
              </p>
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <span className="animate-pulse text-sm text-gray-600 dark:text-gray-400">Thinking</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
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
                      ? 'bg-emerald-500 text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/30'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-2 pl-4 pr-2 dark:border-gray-700 dark:bg-gray-800/50">
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
                className="min-h-[44px] flex-1 resize-none bg-transparent text-sm placeholder:text-gray-500 focus:outline-none dark:placeholder:text-gray-400"
              />
              <Button
                type="button"
                onClick={() => handleSubmit(undefined)}
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-full bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Link
              to="/profile"
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-white shadow-md transition hover:bg-emerald-600"
            >
              <HelpCircle className="h-5 w-5" />
              Start Quiz
            </Link>
          </div>

          {!sessionId && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mode</span>
              <div className="flex rounded-md bg-gray-200/80 p-0.5 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedMode('ollama')}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                    selectedMode === 'ollama'
                      ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('gemini')}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                    selectedMode === 'gemini'
                      ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Gemini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
