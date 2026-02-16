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
        <CardTitle className="text-base">Activity & Progress</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Recent activity overview</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Active</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <BookMarked className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Recent Topic</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {recentTopic || '—'}
              </p>
            </div>
          </div>
          {lastQuizScore != null && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Award className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Quiz Score</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{lastQuizScore}%</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
