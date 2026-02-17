import { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, errorMessage, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-base text-slate-900 transition-all',
              'placeholder:text-slate-500',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400',
              {
                'border-slate-300 dark:border-slate-600': !error && !isFocused,
                'border-violet-500 shadow-sm shadow-violet-500/20': !error && isFocused,
                'border-red-500 focus-visible:ring-red-500': error,
                'pl-10': leftIcon,
                'pr-10': rightIcon,
              },
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
