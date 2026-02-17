import { User, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cleanMarkdown } from '../../lib/markdownCleaner';
import { renderMathInText } from '../../lib/mathRenderer';
import 'katex/dist/katex.min.css';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const raw = message.content?.trim() || '';

  // Process the content
  let processedContent = raw;

  if (!isUser && raw) {
    // For AI responses: clean markdown artifacts and render math
    processedContent = cleanMarkdown(raw);
    processedContent = renderMathInText(processedContent);
  } else if (isUser && raw) {
    // For user messages: just render math, keep text as-is
    processedContent = renderMathInText(raw.replace(/\n/g, '<br/>'));
  }

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
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2',
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white ring-violet-500/20'
            : 'bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 ring-violet-500/10 dark:from-violet-900/40 dark:to-violet-800/40 dark:text-violet-300 dark:ring-violet-500/20'
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all',
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-violet-500/20'
            : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
        )}
      >
        {/* Content */}
        <div
          dangerouslySetInnerHTML={{
            __html: processedContent || '<p class="opacity-70 text-sm">No response yet.</p>'
          }}
          className={cn(
            'prose prose-sm max-w-none break-words leading-relaxed',
            isUser
              ? 'prose-invert [&_*]:text-white [&_a]:text-violet-200 [&_code]:bg-violet-800 [&_code]:text-violet-100'
              : 'text-slate-800 dark:text-slate-100 [&_*]:text-slate-800 [&_*]:dark:text-slate-100 [&_a]:text-violet-600 [&_a]:dark:text-violet-400 [&_code]:bg-slate-100 [&_code]:dark:bg-slate-700 [&_code]:text-slate-800 [&_code]:dark:text-slate-100',
            // Clean typography
            '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
            '[&_strong]:font-semibold',
            '[&_em]:italic',
            '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
            '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
            '[&_li]:my-1',
            // Math styles
            '[&_.katex]:text-current',
            '[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto'
          )}
        />

        {/* Timestamp (shows on hover) */}
        <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className={cn(
            'text-xs',
            isUser ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'
          )}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
