import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          'active:scale-95',

          // Variant styles
          {
            // Primary
            'bg-[hsl(var(--primary))] text-white shadow-md shadow-[hsl(var(--primary)/0.25)] hover:bg-[hsl(var(--primary-hover))] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.3)]':
              variant === 'primary',

            // Secondary
            'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]':
              variant === 'secondary',

            // Outline
            'border-2 border-[hsl(var(--primary))] bg-transparent text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light)/0.3)]':
              variant === 'outline',

            // Ghost
            'bg-transparent text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]':
              variant === 'ghost',

            // Danger
            'bg-red-600 text-white shadow-md shadow-red-500/25 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30':
              variant === 'danger',
          },

          // Size styles
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },

          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
