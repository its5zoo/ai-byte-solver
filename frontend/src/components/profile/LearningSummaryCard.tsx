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
  <div className="flex flex-col items-center rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
    <div
      className={cn(
        'mb-2 flex h-12 w-12 items-center justify-center rounded-xl',
        accent === 'emerald' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        accent === 'violet' && 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
        accent === 'orange' && 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
        !accent && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
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
        !accent && 'text-gray-900 dark:text-white'
      )}
    >
      {value}
    </p>
    <p className="mt-0.5 text-center text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
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
