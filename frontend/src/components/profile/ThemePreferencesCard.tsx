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
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Theme & Preferences</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
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
                  'inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  theme === opt.value
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-light)/0.3)] text-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.5)] text-[hsl(var(--foreground-secondary))] hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[hsl(var(--foreground-tertiary))]">Language</p>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{language}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
