import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Loader2, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/chat', { replace: true });
  }, [token, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  // Password strength indicators
  const passwordStrength = {
    length: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-500/20">
            <Brain className="h-9 w-9 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              AI Byte Solver
            </h1>
            <p className="text-lg text-emerald-200">Start Your Learning Journey</p>
          </div>
        </div>

        {/* Register card */}
        <div className="rounded-3xl border border-slate-700/50 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/95">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create Account
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Join thousands of students learning smarter
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200 animate-shake">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                Full Name
              </label>
              <Input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                leftIcon={<User className="h-5 w-5" />}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                Email Address
              </label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                leftIcon={<Mail className="h-5 w-5" />}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
                Password
              </label>
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                leftIcon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                autoComplete="new-password"
              />

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full ${passwordStrength.length ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      {passwordStrength.length && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={passwordStrength.length ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                      At least 6 characters
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 hover:underline transition-all"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-emerald-200/70">
          By signing up, you start your journey to academic excellence
        </p>
      </div>
    </div>
  );
}
