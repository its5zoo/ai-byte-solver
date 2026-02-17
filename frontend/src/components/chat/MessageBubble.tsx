import { User, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import { processAIResponse, processUserMessage } from '../../lib/markdownCleaner';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const raw = message.content?.trim() || '';

  // Process the content using the unified processor
  const processedContent = isUser
    ? processUserMessage(raw)
    : processAIResponse(raw);

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in-up',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'group relative rounded-2xl px-4 py-3 shadow-sm transition-all',
          isUser
            ? 'max-w-[75%] bg-violet-600 text-white'
            : 'max-w-[90%] bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
        )}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: processedContent || '<span class="opacity-60 text-sm">No response yet.</span>'
          }}
          className={cn(
            'text-sm leading-relaxed break-words',
            isUser
              ? '[&_*]:text-white [&_code]:bg-violet-500/40 [&_code]:text-white'
              : 'text-slate-800 dark:text-slate-100 [&_strong]:font-semibold [&_code]:bg-slate-100 [&_code]:dark:bg-slate-700',
            // Lists
            '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5',
            '[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
            '[&_li]:my-0.5',
            '[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
            // Math
            '[&_.katex]:text-current',
            '[&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto',
            // HR
            '[&_hr]:my-2'
          )}
        />
      </div>
    </div>
  );
}
