import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';

type ChatMode = 'syllabus' | 'open';

interface DashboardHeaderProps {
  mode: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

export default function DashboardHeader({ mode, onModeChange }: DashboardHeaderProps) {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <header className="glass sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b px-4 transition-all">
      <div className="flex items-center gap-6">
        <Link to="/chat" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <div className="flex rounded-lg bg-[hsl(var(--muted))] p-0.5">
          <button
            type="button"
            onClick={() => onModeChange?.('syllabus')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-bold transition-all duration-300',
              mode === 'syllabus'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-105'
                : 'text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-emerald-600'
            )}
          >
            Syllabus Mode
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('open')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-bold transition-all duration-300',
              mode === 'open'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-105'
                : 'text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-violet-600'
            )}
          >
            Open Mode
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[hsl(var(--foreground-secondary))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <span>Hello, {user?.name?.split(' ')[0] || 'User'}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
            {initials}
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
