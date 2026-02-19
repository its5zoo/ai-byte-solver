import { cn } from '../../lib/utils';

interface AILogoProps {
    className?: string;
}

export const AILogo = ({ className }: AILogoProps) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-full h-full select-none", className)}
        >
            <defs>
                <linearGradient id="aiLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
            </defs>

            {/* Background Rounded Square */}
            <rect x="0" y="0" width="100" height="100" rx="28" fill="url(#aiLogoGradient)" />

            {/* Central Circle */}
            <circle cx="50" cy="50" r="9" fill="white" />

            {/* Radial Lines and Nodes */}
            <g stroke="white" strokeWidth="2.5">
                {/* 12 o'clock */}
                <line x1="50" y1="41" x2="50" y2="24" />
                <circle cx="50" cy="24" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 1:30 */}
                <line x1="56" y1="44" x2="68" y2="32" />
                <circle cx="68" cy="32" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 3 o'clock */}
                <line x1="59" y1="50" x2="76" y2="50" />
                <circle cx="76" cy="50" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 4:30 */}
                <line x1="56" y1="56" x2="68" y2="68" />
                <circle cx="68" cy="68" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 6 o'clock */}
                <line x1="50" y1="59" x2="50" y2="76" />
                <circle cx="50" cy="76" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 7:30 */}
                <line x1="44" y1="56" x2="32" y2="68" />
                <circle cx="32" cy="68" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 9 o'clock */}
                <line x1="41" y1="50" x2="24" y2="50" />
                <circle cx="24" cy="50" r="4.5" fill="none" strokeWidth="2.5" />

                {/* 10:30 - SOLID WHITE CIRCLE */}
                <line x1="44" y1="44" x2="32" y2="32" />
                <circle cx="32" cy="32" r="6" fill="white" stroke="none" />
            </g>
        </svg>
    );
};
