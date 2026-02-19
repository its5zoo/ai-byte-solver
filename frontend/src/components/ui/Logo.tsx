import { AILogo } from './AILogo';
import { cn } from '../../lib/utils';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
}

export default function Logo({
    className,
    iconClassName,
    textClassName,
    showText = true
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className={cn(
                "relative flex h-9 w-9 items-center justify-center overflow-hidden group transition-transform hover:scale-105",
                iconClassName
            )}>
                <AILogo className="relative z-10 w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:animate-shimmer z-20 pointer-events-none" />
            </div>
            {showText && (
                <span className={cn(
                    "relative text-lg font-extrabold tracking-tight",
                    textClassName
                )}>
                    <span className="bg-gradient-to-r from-neutral-900 via-neutral-400 to-neutral-900 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        AI Byte
                    </span>
                    <span className="ml-1.5 text-violet-600 dark:text-violet-400">Solver</span>
                </span>
            )}
        </div>
    );
}
