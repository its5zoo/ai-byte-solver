import { HelpCircle, BookOpen, Target, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

interface LearningSummaryCardProps {
  doubtsSolved: number;
  quizzesAttempted: number;
  accuracyPercent: number;
  currentStreak: number;
}

const StatItem = ({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  accent?: 'emerald' | 'violet' | 'orange';
}) => (
  <div className="flex flex-col items-center rounded-xl p-4 transition-colors hover:bg-[hsl(var(--glass-bg)/0.5)]">
    <div
      className={cn(
        'mb-2 flex h-12 w-12 items-center justify-center rounded-xl',
        accent === 'emerald' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        accent === 'violet' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        accent === 'orange' && 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        !accent && 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]'
      )}
    >
      <Icon className="h-6 w-6" />
    </div>
    <p
      className={cn(
        'text-2xl font-bold tabular-nums',
        accent === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        accent === 'violet' && 'text-violet-600 dark:text-violet-400',
        accent === 'orange' && 'text-orange-600 dark:text-orange-400',
        !accent && 'text-[hsl(var(--foreground))]'
      )}
    >
      {value}
    </p>
    <p className="mt-0.5 text-center text-xs font-medium text-[hsl(var(--foreground-secondary))]">{label}</p>
  </div>
);

export default function LearningSummaryCard({
  doubtsSolved,
  quizzesAttempted,
  accuracyPercent,
  currentStreak,
}: LearningSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Learning Summary</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Your progress at a glance</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatItem icon={HelpCircle} value={doubtsSolved} label="Doubts Solved" accent="emerald" />
          <StatItem icon={BookOpen} value={quizzesAttempted} label="Quizzes Taken" accent="violet" />
          <StatItem icon={Target} value={`${accuracyPercent}%`} label="Accuracy" />
          <StatItem icon={Flame} value={currentStreak} label="Day Streak" accent="orange" />
        </div>
      </CardContent>
    </Card>
  );
}
