import { BarChart3, TrendingUp, LineChart, HelpCircle, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import QuizModal from '../ui/QuizModal';

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

interface Doubt {
  _id: string;
  question: string;
  count: number;
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Backend weeklyActivity: 0=Sun, 1=Mon, ... 6=Sat. Display Mon–Sun.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function RightSidebar({ summary, streak, timeline: _timeline, topics }: RightSidebarProps) {
  const maxTopicCount = Math.max(1, ...topics.map((t) => t.count));
  const topTopics = topics.slice(0, 5).map((t) => ({
    ...t,
    percent: Math.round((t.count / maxTopicCount) * 100),
  }));

  const rawWeek = streak?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0];
  const weekActivity = WEEK_ORDER.map((i) => rawWeek[i] ?? 0);
  const streakDays = streak?.currentStreak ?? 0;

  const [doubts, setDoubts] = useState<Doubt[]>([]);

  // Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  useEffect(() => {
    // @ts-ignore
    api.getTopDoubts?.(5).then(res => setDoubts(res.data.doubts || [])).catch(() => { });
  }, [summary]); // Refresh when summary updates (implies chat activity)

  return (
    <aside className="glass flex h-full w-80 flex-col overflow-y-auto border-l p-4 transition-all">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
        <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        Learning Insights
      </h3>

      <div className="space-y-4">
        {topTopics.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 pb-1">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Most Asked Topics
              </CardTitle>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Based on last 30 days</p>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              {topTopics.map((t, i) => (
                <div key={t.topic}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate text-[hsl(var(--foreground-secondary))]">{t.topic}</span>
                    <span className="tabular-nums text-[hsl(var(--foreground-tertiary))]">{t.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        i % 2 === 0 ? 'bg-violet-500' : 'bg-violet-400'
                      )}
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {doubts.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 pb-1">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Frequent Doubts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {doubts.map((d) => (
                <div key={d._id} className="flex items-start gap-2 text-xs">
                  <HelpCircle className="h-3.5 w-3.5 mt-0.5 text-violet-500 shrink-0" />
                  <span className="text-[hsl(var(--foreground-secondary))] line-clamp-2" title={d.question}>
                    {d.question}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 pb-1">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Study Consistency
            </CardTitle>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">This week</p>
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
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm">
              <span className="font-bold text-[hsl(var(--primary))]">{streakDays} days</span>
              <span className="text-[hsl(var(--foreground-secondary))]"> streak 🔥</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-500/30 ring-4 ring-white/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                <BarChart3 className="relative z-10 h-7 w-7 text-white" />
              </div>
              <div>
                <p
                  className="text-4xl font-black tabular-nums text-white leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {summary?.doubtsSolved ?? 0}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-300">
                  Doubts Solved
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-500/30 ring-4 ring-white/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                <TrendingUp className="relative z-10 h-7 w-7 text-white" />
              </div>
              <div>
                <p
                  className="text-4xl font-black tabular-nums text-white leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {summary?.quizAttempts ?? 0}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-300">
                  Quizzes Taken
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz Button */}
        <Button
          variant="primary"
          onClick={() => setIsQuizModalOpen(true)}
          className="w-full mt-4 mb-2 py-6 rounded-2xl shadow-md border-2 border-violet-500/20 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center justify-center gap-3 text-sm">
            <GraduationCap className="h-5 w-5" />
            Practice Quiz
          </span>
        </Button>

        <QuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          topics={topics}
        />

        {(summary?.doubtsSolved === 0 && summary?.quizAttempts === 0) || (!summary && topics.length === 0) ? (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Start chatting to see your insights here.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
