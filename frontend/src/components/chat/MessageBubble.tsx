import { User, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderMath(content: string): string {
  let html = content;
  const inlineRegex = /\\\(([\s\S]*?)\\\)/g;
  const blockRegex = /\\\[([\s\S]*?)\\\]/g;

  html = html.replace(inlineRegex, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `\\(${math}\\)`;
    }
  });
  html = html.replace(blockRegex, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `\\[${math}\\]`;
    }
  });

  html = html.replace(/\n/g, '<br/>');
  return html;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const raw = message.content?.trim() || '';
  const html = raw ? renderMath(message.content) : '';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-emerald-500 text-white'
            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-emerald-500 text-white'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
        )}
      >
        <div
          dangerouslySetInnerHTML={{ __html: html || '<p class="opacity-80">No response yet.</p>' }}
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert break-words',
            isUser
              ? 'text-white [&_*]:text-white [&_a]:text-emerald-200'
              : 'text-gray-900 dark:text-gray-100 [&_*]:text-gray-900 [&_*]:dark:text-gray-100'
          )}
        />
      </div>
    </div>
  );
}
