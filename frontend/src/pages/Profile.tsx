import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  ProfileHeader,
  ProfileEditModal,
  AccountInfoCard,
  LearningSummaryCard,
  ActivityProgressCard,
  ThemePreferencesCard,
  ProfileActions,
} from '../components/profile';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import api from '../lib/api';

interface FullUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  createdAt?: string;
  preferences?: { theme?: string; language?: string };
}

interface Summary {
  doubtsSolved: number;
  quizAttempts: number;
  accuracyPercent: number;
}

interface Streak {
  currentStreak: number;
  lastActiveDate?: string;
}

interface Doubt {
  _id: string;
  question: string;
  frequency: number;
  lastAsked: string;
}

interface QuizAttempt {
  percentage?: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user: storeUser, logout, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<QuizAttempt[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const [userRes, summaryRes, streakRes, topicsRes, quizRes, doubtsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/stats/summary'),
        api.get('/streaks'),
        api.get('/stats/topics'),
        api.get('/stats/topics'),
        api.get('/stats/quiz'),
        // @ts-ignore
        api.getTopDoubts(10),
      ]);
      setFullUser(userRes.data.user || null);
      setSummary(summaryRes.data.summary || null);
      setStreak(streakRes.data.streak || null);
      setTopics(topicsRes.data.topics || []);
      setQuizPerformance(quizRes.data.performance || []);
      // @ts-ignore
      setDoubts(doubtsRes?.data?.doubts || []);
    } catch {
      setFullUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const prefTheme = fullUser?.preferences?.theme;
    if (prefTheme && (prefTheme === 'light' || prefTheme === 'dark' || prefTheme === 'system')) {
      setTheme(prefTheme);
      const root = document.documentElement;
      const isDark =
        prefTheme === 'dark' ||
        (prefTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
    }
  }, [fullUser?.preferences?.theme, setTheme]);

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    const root = document.documentElement;
    const isDark =
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    api.patch('/users/me', { preferences: { theme: t } }).catch(() => { });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (data: { name: string; avatar?: string | null }) => {
    const { data: res } = await api.patch('/users/me', {
      name: data.name,
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    });
    const updated = res.user;
    setFullUser(updated);
    updateUser({
      name: updated.name,
      avatar: updated.avatar,
      preferences: updated.preferences,
    });
  };

  const user = fullUser ?? storeUser;
  const loginMethod = fullUser?.googleId ? 'Google' : 'Email';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-gradient)] bg-attachment-fixed transition-colors">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/chat"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground-secondary))] transition-colors hover:text-[hsl(var(--primary))]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-8">
          <ProfileHeader
            name={user?.name || 'Student'}
            email={user?.email || ''}
            avatar={user?.avatar}
            onEditClick={handleEditProfile}
          />
          <ProfileEditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            currentName={user?.name || ''}
            currentAvatar={user?.avatar}
            onSave={handleSaveProfile}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <AccountInfoCard
              name={user?.name || '—'}
              email={user?.email || '—'}
              loginMethod={loginMethod}
              createdAt={fullUser?.createdAt}
            />

            <LearningSummaryCard
              doubtsSolved={summary?.doubtsSolved ?? 0}
              quizzesAttempted={summary?.quizAttempts ?? 0}
              accuracyPercent={summary?.accuracyPercent ?? 0}
              currentStreak={streak?.currentStreak ?? 0}
            />
          </div>

          <ActivityProgressCard
            lastActiveDate={streak?.lastActiveDate}
            recentTopic={topics[0]?.topic}
            lastQuizScore={quizPerformance[0]?.percentage ?? null}
          />

          {doubts.length > 0 && (
            <div className="glass rounded-2xl border border-[hsl(var(--glass-border))] p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                Frequently Asked Doubts
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {doubts.map((d) => (
                  <div key={d._id} className="rounded-xl border border-slate-200 bg-white/50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-medium text-slate-800 dark:text-slate-200 mb-1 line-clamp-2" title={d.question}>
                      {d.question}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Asked {d.frequency} times • Last: {new Date(d.lastAsked).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ThemePreferencesCard
            theme={(theme as 'light' | 'dark' | 'system') || 'system'}
            language={user?.preferences?.language === 'en' ? 'English' : 'English'}
            onThemeChange={applyTheme}
          />

          <div className="glass rounded-2xl border border-[hsl(var(--glass-border))] p-6 shadow-sm">
            <ProfileActions onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
