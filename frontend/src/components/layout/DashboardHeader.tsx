import { Link } from 'react-router-dom';
import { Brain, LogOut, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-6">
        <Link to="/chat" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">AI Byte Solver</span>
        </Link>
        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => onModeChange?.('syllabus')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'syllabus'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
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
                ? 'bg-emerald-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            Open Mode
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">Hello, {user?.name?.split(' ')[0] || 'User'}</span>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {initials}
        </div>
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
