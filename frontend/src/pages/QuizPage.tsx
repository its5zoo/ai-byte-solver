import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HelpCircle, Trophy, ChevronLeft, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  correctOption?: number;
  topic?: string;
  difficulty?: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: QuizQuestion[];
}

interface QuizAttempt {
  questionId: string;
  selectedOption: number;
  isCorrect?: boolean;
}

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep] = useState<'generate' | 'quiz' | 'result'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; attempts: QuizAttempt[] } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleGenerate = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/quiz/generate', {
        sessionId,
        count: 5,
        difficulty: 'mixed',
      });
      const quizId = data.quiz?.id ?? data.quiz?._id;
      if (!quizId) throw new Error('No quiz ID returned');

      const getRes = await api.get(`/quiz/${quizId}`);
      const q = getRes.data.quiz;

      // Filter to MCQ only
      if (q?.questions) {
        q.questions = q.questions
          .filter((qu: QuizQuestion) => qu.type === 'mcq')
          .map((qu: { _id?: string; id?: string }) => ({
            ...qu,
            id: qu._id ?? qu.id,
          }));
      }

      setQuiz(q);
      setStep('quiz');
      setAnswers({});
      setCurrentQuestion(0);
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
        selectedOption: answers[q.id] ?? 0,
      }));

      const { data } = await api.post(`/quiz/${quiz._id}/attempt`, { answers: answersPayload });
      setResult({
        ...data.result,
        attempts: answersPayload.map((a, idx) => ({
          ...a,
          isCorrect: quiz.questions[idx].correctOption === a.selectedOption,
        }))
      });
      setStep('result');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;
  const currentQ = quiz?.questions[currentQuestion];
  const isLastQuestion = quiz && currentQuestion === quiz.questions.length - 1;
  const allAnswered = quiz && quiz.questions.every(q => answers[q.id] !== undefined);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
        <HelpCircle className="h-16 w-16 text-violet-600 dark:text-violet-400" />
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
          No chat selected. Start a chat first, then come back to take a quiz.
        </p>
        <Link
          to="/chat"
          className="text-violet-600 hover:text-violet-500 dark:text-violet-400 font-medium hover:underline"
        >
          Go to Chat →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back button */}
        <Link
          to={`/chat/${sessionId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        {/* Generate step */}
        {step === 'generate' && (
          <Card className="animate-fade-in-up" hover>
            <CardContent className="p-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/30">
                  <HelpCircle className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Generate Quiz
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-2 max-w-md">
                  Test your knowledge with AI-generated MCQ questions based on your chat.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                  Make sure you have some messages in this chat before generating.
                </p>

                {error && (
                  <div className="mb-6 w-full rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 animate-shake">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  leftIcon={<HelpCircle className="h-5 w-5" />}
                >
                  {loading ? 'Generating Quiz...' : 'Generate Quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz step */}
        {step === 'quiz' && quiz && currentQ && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header with progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                  <Badge variant="primary" size="lg">
                    {currentQuestion + 1} / {quiz.questions.length}
                  </Badge>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
            </Card>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Question card */}
            <Card hover className="animate-scale-in">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex-1">
                    {currentQ.question}
                  </CardTitle>
                  {currentQ.difficulty && (
                    <Badge
                      variant={
                        currentQ.difficulty === 'easy' ? 'success' :
                          currentQ.difficulty === 'medium' ? 'warning' : 'error'
                      }
                    >
                      {currentQ.difficulty}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQ.options?.map((opt, i) => {
                    const isSelected = answers[currentQ.id] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswer(currentQ.id, i)}
                        className={cn(
                          'w-full flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all',
                          'hover:scale-[1.02] active:scale-[0.98]',
                          isSelected
                            ? 'border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/30 shadow-md shadow-violet-500/20'
                            : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-violet-600 dark:hover:bg-violet-950/20'
                        )}
                      >
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0',
                          isSelected
                            ? 'border-violet-600 bg-violet-600 dark:border-violet-500 dark:bg-violet-500'
                            : 'border-slate-300 dark:border-slate-600'
                        )}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={cn(
                          'font-medium',
                          isSelected
                            ? 'text-violet-900 dark:text-violet-100'
                            : 'text-slate-800 dark:text-slate-200'
                        )}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmitAttempt}
                  loading={loading}
                  disabled={loading || !allAnswered}
                  variant="primary"
                  size="lg"
                  leftIcon={<Trophy className="h-5 w-5" />}
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === quiz.questions.length - 1}
                  variant="primary"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Result step */}
        {step === 'result' && result && quiz && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score card */}
            <Card className="overflow-hidden" gradient>
              <CardContent className="p-10">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-2xl shadow-violet-500/40">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">{result.percentage}%</div>
                      <div className="text-sm text-violet-100">Score</div>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Quiz Complete!
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    You got <strong>{result.score}</strong> out of <strong>{result.total}</strong> correct
                  </p>

                  <div className="flex gap-4 mb-6">
                    <Badge variant="success" size="lg" icon={<CheckCircle2 className="h-4 w-4" />}>
                      {result.score} Correct
                    </Badge>
                    <Badge variant="error" size="lg" icon={<XCircle className="h-4 w-4" />}>
                      {result.total - result.score} Incorrect
                    </Badge>
                  </div>

                  <div className="flex gap-3">
                    <Link to={`/chat/${sessionId}`}>
                      <Button variant="outline" leftIcon={<MessageSquare className="h-5 w-5" />}>
                        Back to Chat
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        setStep('generate');
                        setQuiz(null);
                        setResult(null);
                        setAnswers({});
                      }}
                      variant="primary"
                      leftIcon={<HelpCircle className="h-5 w-5" />}
                    >
                      New Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review answers */}
            <Card>
              <CardHeader>
                <CardTitle>Review Your Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quiz.questions.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = q.correctOption === userAnswer;

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'rounded-xl border-2 p-5 transition-all',
                          isCorrect
                            ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                        )}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                            isCorrect ? 'bg-green-500' : 'bg-red-500'
                          )}>
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <XCircle className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">
                              {idx + 1}. {q.question}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Your answer: <strong>{q.options?.[userAnswer] || 'Not answered'}</strong>
                            </p>
                            {!isCorrect && q.correctOption !== undefined && (
                              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                Correct answer: <strong>{q.options?.[q.correctOption]}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
