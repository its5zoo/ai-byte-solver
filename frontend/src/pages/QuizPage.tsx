import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, HelpCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../lib/api';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  topic?: string;
  difficulty?: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<'generate' | 'quiz' | 'result'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: number; shortAnswer?: string }>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  const handleGenerate = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/quiz/generate', {
        sessionId,
        count: 5,
        difficulty: 'mixed',
        aiProvider: 'ollama',
      });
      const quizId = data.quiz?.id ?? data.quiz?._id;
      if (!quizId) throw new Error('No quiz ID returned');
      const getRes = await api.get(`/quiz/${quizId}`);
      const q = getRes.data.quiz;
      if (q?.questions) {
        q.questions = q.questions.map((qu: { _id?: string; id?: string }) => ({
          ...qu,
          id: qu._id ?? qu.id,
        }));
      }
      setQuiz(q);
      setStep('quiz');
      setAnswers({});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to generate quiz. Ensure you have chat messages and Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!quiz) return;
    setLoading(true);
    setError('');
    try {
      const answersPayload = quiz.questions.map((q) => ({
        questionId: q.id ?? (q as unknown as { _id: string })._id,
        ...(q.type === 'mcq'
          ? { selectedOption: answers[q.id]?.selectedOption ?? 0 }
          : { shortAnswer: answers[q.id]?.shortAnswer ?? '' }),
      }));
      const { data } = await api.post(`/quiz/${quiz._id}/attempt`, { answers: answersPayload });
      setResult(data.result);
      setStep('result');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, value: number | string, type: 'mcq' | 'short') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: type === 'mcq' ? { selectedOption: value as number } : { shortAnswer: value as string },
    }));
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-4 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">No chat selected. Start a chat first, then open Quiz.</p>
        <Link to="/chat" className="text-emerald-600 hover:underline dark:text-emerald-400">Back to Chat</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          to={`/chat/${sessionId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          ← Back to Chat
        </Link>

        {step === 'generate' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
                <HelpCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Quiz</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                AI will create a quiz from your chat. Make sure you have some messages in this chat.
              </p>
              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </p>
              )}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 rounded-xl bg-emerald-500 px-8 py-3 text-white hover:bg-emerald-600"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate Quiz'}
              </Button>
            </div>
          </div>
        )}

        {step === 'quiz' && quiz && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}
            <div className="space-y-6">
              {quiz.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <p className="mb-3 font-medium text-gray-900 dark:text-white">
                    {idx + 1}. {q.question}
                  </p>
                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id]?.selectedOption === i}
                            onChange={() => setAnswer(q.id, i, 'mcq')}
                            className="h-4 w-4 text-emerald-600"
                          />
                          <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'short' && (
                    <input
                      type="text"
                      value={answers[q.id]?.shortAnswer ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value, 'short')}
                      placeholder="Your answer..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                  )}
                </div>
              ))}
            </div>
            <Button
              onClick={handleSubmitAttempt}
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-white hover:bg-emerald-600"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Submit Quiz'}
            </Button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {result.percentage}%
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Complete</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                You got {result.score} out of {result.total} correct.
              </p>
              <div className="mt-6 flex gap-3">
                <Link to={`/chat/${sessionId}`}>
                  <Button variant="outline" className="rounded-xl">Back to Chat</Button>
                </Link>
                <Button
                  onClick={() => { setStep('generate'); setQuiz(null); setResult(null); }}
                  className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  New Quiz
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
