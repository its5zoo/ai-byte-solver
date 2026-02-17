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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-center gap-6">
        <Link to="/chat" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo />
        </Link>
        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => onModeChange?.('syllabus')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'syllabus'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            Syllabus Mode
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('open')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'open'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            Open Mode
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span>Hello, {user?.name?.split(' ')[0] || 'User'}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            {initials}
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
