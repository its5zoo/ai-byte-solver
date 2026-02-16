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
  accent?: 'primary' | 'accent' | 'orange';
}) => (
  <div className="flex flex-col items-center rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
    <div
      className={cn(
        'mb-2 flex h-10 w-10 items-center justify-center rounded-lg',
        accent === 'primary' && 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
        accent === 'accent' && 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400',
        accent === 'orange' && 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
        !accent && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
    <p
      className={cn(
        'text-xl font-bold tabular-nums',
        accent === 'primary' && 'text-primary-600 dark:text-primary-400',
        accent === 'accent' && 'text-accent-600 dark:text-accent-400',
        accent === 'orange' && 'text-orange-600 dark:text-orange-400',
        !accent && 'text-gray-900 dark:text-white'
      )}
    >
      {value}
    </p>
    <p className="mt-0.5 text-center text-xs text-gray-500 dark:text-gray-400">{label}</p>
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
        <CardTitle className="text-base">Learning Summary</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your progress at a glance</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatItem icon={HelpCircle} value={doubtsSolved} label="Doubts Solved" accent="primary" />
          <StatItem icon={BookOpen} value={quizzesAttempted} label="Quizzes Taken" accent="accent" />
          <StatItem icon={Target} value={`${accuracyPercent}%`} label="Accuracy" />
          <StatItem icon={Flame} value={currentStreak} label="Day Streak" accent="orange" />
        </div>
      </CardContent>
    </Card>
  );
}
