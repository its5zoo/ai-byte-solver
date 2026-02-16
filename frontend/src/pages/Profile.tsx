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
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const [userRes, summaryRes, streakRes, topicsRes, quizRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/stats/summary'),
        api.get('/streaks'),
        api.get('/stats/topics'),
        api.get('/stats/quiz'),
      ]);
      setFullUser(userRes.data.user || null);
      setSummary(summaryRes.data.summary || null);
      setStreak(streakRes.data.streak || null);
      setTopics(topicsRes.data.topics || []);
      setQuizPerformance(quizRes.data.performance || []);
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
    api.patch('/users/me', { preferences: { theme: t } }).catch(() => {});
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/chat"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400"
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

          <ThemePreferencesCard
            theme={(theme as 'light' | 'dark' | 'system') || 'system'}
            language={user?.preferences?.language === 'en' ? 'English' : 'English'}
            onThemeChange={applyTheme}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <ProfileActions onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
