import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  ProfileHeader,
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
  const { user: storeUser, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [fullUser, setFullUser] = useState<FullUser | null>(null);
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

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    const root = document.documentElement;
    const isDark =
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    // Placeholder - could open modal or navigate to edit page
  };

  const user = fullUser ?? storeUser;
  const loginMethod = fullUser?.googleId ? 'Google' : 'Email';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/chat"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <ProfileHeader
            name={user?.name || 'Student'}
            email={user?.email || ''}
            avatar={user?.avatar}
            onEditClick={handleEditProfile}
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

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <ProfileActions onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
