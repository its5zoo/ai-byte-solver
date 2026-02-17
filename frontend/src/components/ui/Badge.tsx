import { forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    removable?: boolean;
    onRemove?: () => void;
    icon?: React.ReactNode;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    (
        {
            className,
            variant = 'default',
            size = 'md',
            removable = false,
            onRemove,
            icon,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',

                    // Variant styles
                    {
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': variant === 'default',
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'error',
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
                        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400': variant === 'primary',
                    },

                    // Size styles
                    {
                        'px-2 py-0.5 text-xs': size === 'sm',
                        'px-2.5 py-1 text-sm': size === 'md',
                        'px-3 py-1.5 text-base': size === 'lg',
                    },

                    className
                )}
                {...props}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <span>{children}</span>
                {removable && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove?.();
                        }}
                        className="flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="Remove"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        );
    }
);

Badge.displayName = 'Badge';
export default Badge;
