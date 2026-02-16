import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <BookOpen className="h-10 w-10 text-primary-600" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">AI Byte Solver</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <p className="text-sm text-gray-500">Join AI Byte Solver</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
