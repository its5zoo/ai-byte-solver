import { Clock, BookMarked, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface ActivityProgressCardProps {
  lastActiveDate?: string | null;
  recentTopic?: string | null;
  lastQuizScore?: number | null;
}

export default function ActivityProgressCard({
  lastActiveDate,
  recentTopic,
  lastQuizScore,
}: ActivityProgressCardProps) {
  const formattedDate = lastActiveDate
    ? new Date(lastActiveDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Activity & Progress</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Recent activity overview</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[hsl(var(--foreground-tertiary))]">Last Active</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[hsl(var(--foreground-tertiary))]">Recent Topic</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {recentTopic || '—'}
              </p>
            </div>
          </div>
          {lastQuizScore != null && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[hsl(var(--foreground-tertiary))]">Last Quiz Score</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{lastQuizScore}%</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
