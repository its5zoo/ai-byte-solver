import { User } from 'lucide-react';
import { AILogo } from '../ui/AILogo';
import { cn } from '../../lib/utils';
import { processAIResponse, processUserMessage } from '../../lib/markdownCleaner';
import { useAuthStore } from '../../stores/authStore';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const { user } = useAuthStore();
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
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 overflow-hidden',
          isUser
            ? 'bg-violet-600 text-white shadow-violet-500/20'
            : 'ring-2 ring-violet-500/20 shadow-violet-500/30'
        )}
      >
        {isUser ? (
          user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-4 w-4" />
          )
        ) : (
          <AILogo className="h-full w-full" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'group relative rounded-2xl px-4 py-3 shadow-md transition-all',
          isUser
            ? 'max-w-[85%] bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/20'
            : 'max-w-[95%] glass-elevated border border-[hsl(var(--glass-border))]'
        )}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: processedContent || '<span class="opacity-60 text-sm">No response yet.</span>'
          }}
          className={cn(
            'leading-relaxed break-words',
            isUser
              ? 'text-sm [&_*]:text-white [&_code]:bg-white/20 [&_code]:text-white'
              : 'text-[15px] font-medium font-sans text-[hsl(var(--foreground))] [&_strong]:text-[hsl(var(--foreground))] [&_strong]:font-bold [&_:not(pre)>code]:bg-[hsl(var(--muted))] [&_:not(pre)>code]:text-[hsl(var(--primary))] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md',
            // Paragraphs
            '[&_p]:my-2.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
            // Lists — tight, consistent indentation
            '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
            '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
            '[&_li]:leading-relaxed [&_li]:pl-0.5',
            // Nested lists
            '[&_ul_ul]:mt-0.5 [&_ul_ul]:mb-0 [&_ol_ol]:mt-0.5 [&_ol_ol]:mb-0',
            // Math
            '[&_.katex]:text-current',
            '[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:text-center',
            // HR
            '[&_hr]:my-3',
            // Strong headings
            '[&_strong.block]:mt-4 [&_strong.block:first-child]:mt-0'
          )}
        />
      </div>
    </div>
  );
}
