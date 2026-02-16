import { BarChart3, TrendingUp, LineChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

interface Summary {
  doubtsSolved: number;
  studyTimeMinutes: number;
  topicsCovered: number;
  quizAttempts: number;
  averageQuizScore: number;
  accuracyPercent: number;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: number[];
  totalStudyDays: number;
}

interface RightSidebarProps {
  summary: Summary | null;
  streak: Streak | null;
  timeline: { date: string; doubtsSolved: number; studyTimeMinutes: number }[];
  topics: { topic: string; count: number }[];
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Backend weeklyActivity: 0=Sun, 1=Mon, ... 6=Sat. Display Mon–Sun.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function RightSidebar({ summary, streak, timeline, topics }: RightSidebarProps) {
  const maxTopicCount = Math.max(1, ...topics.map((t) => t.count));
  const topTopics = topics.slice(0, 5).map((t) => ({
    ...t,
    percent: Math.round((t.count / maxTopicCount) * 100),
  }));

  const rawWeek = streak?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0];
  const weekActivity = WEEK_ORDER.map((i) => rawWeek[i] ?? 0);
  const streakDays = streak?.currentStreak ?? 0;

  return (
    <aside className="flex h-full w-80 flex-col overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <LineChart className="h-5 w-5 text-emerald-500" />
        Learning Insights
      </h3>

      <div className="space-y-4">
        {topTopics.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 pb-1">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Most Asked Topics
              </CardTitle>
              <p className="text-xs text-gray-400 dark:text-gray-500">Based on last 30 days</p>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              {topTopics.map((t, i) => (
                <div key={t.topic}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate text-gray-700 dark:text-gray-300">{t.topic}</span>
                    <span className="tabular-nums text-gray-500">{t.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        i % 2 === 0 ? 'bg-emerald-500' : 'bg-violet-500'
                      )}
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Study Consistency
            </CardTitle>
            <p className="text-xs text-gray-400 dark:text-gray-500">This week</p>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="mb-2 flex justify-between">
              <div className="flex gap-1">
                {WEEK_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                      weekActivity[i] > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm">
              <span className="font-bold text-emerald-500">{streakDays} days</span>
              <span className="text-gray-500 dark:text-gray-400"> streak</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {summary?.doubtsSolved ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Doubts Solved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {summary?.quizAttempts ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Quizzes Taken</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {(summary?.doubtsSolved === 0 && summary?.quizAttempts === 0) || (!summary && topics.length === 0) ? (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Start chatting to see your insights here.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
