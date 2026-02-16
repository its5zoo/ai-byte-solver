import { Sun, Moon, Monitor, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemePreferencesCardProps {
  theme: Theme;
  language?: string;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemePreferencesCard({
  theme,
  language = 'English',
  onThemeChange,
}: ThemePreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Theme & Preferences</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Appearance
          </p>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onThemeChange(opt.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  theme === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Language</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{language}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
