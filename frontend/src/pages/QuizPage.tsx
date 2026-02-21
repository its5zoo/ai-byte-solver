import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HelpCircle, Trophy, ChevronLeft, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../lib/api';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// All LaTeX command names we want to detect as bare math
const LATEX_COMMANDS = new Set([
  'dfrac', 'frac', 'sqrt', 'omega', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda',
  'mu', 'pi', 'sigma', 'phi', 'psi', 'Omega', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Theta',
  'Lambda', 'Sigma', 'Phi', 'Psi', 'vec', 'hat', 'bar', 'dot', 'ddot', 'tilde', 'mathbf',
  'mathrm', 'mathit', 'text', 'left', 'right', 'cdot', 'times', 'div', 'pm', 'mp', 'leq',
  'geq', 'neq', 'approx', 'infty', 'partial', 'nabla', 'sum', 'prod', 'int', 'lim', 'log',
  'ln', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan',
]);

/**
 * Reads one balanced {…} group starting at `pos` (which must be `{`).
 * Returns the index AFTER the closing `}`.
 */
function readBraceGroup(s: string, pos: number): number {
  let depth = 0;
  while (pos < s.length) {
    if (s[pos] === '{') depth++;
    else if (s[pos] === '}') { depth--; if (depth === 0) return pos + 1; }
    pos++;
  }
  return pos;
}

/**
 * Walk a non-math text segment and wrap every bare LaTeX command
 * (plus its arguments / sub- / superscripts) inside `$...$`.
 * Handles nested braces correctly via readBraceGroup.
 */
function wrapBareLaTeX(seg: string): string {
  let out = '';
  let i = 0;
  while (i < seg.length) {
    if (seg[i] === '\\') {
      // Read the command name
      let j = i + 1;
      while (j < seg.length && /[a-zA-Z]/.test(seg[j])) j++;
      const cmd = seg.slice(i + 1, j);
      if (LATEX_COMMANDS.has(cmd)) {
        // Consume optional whitespace after command
        let k = j;
        // Greedily consume brace groups and sub/superscripts
        let changed = true;
        while (changed && k < seg.length) {
          changed = false;
          // Brace group {…}
          if (seg[k] === '{') {
            k = readBraceGroup(seg, k);
            changed = true;
          }
          // Subscript _ or superscript ^
          if (k < seg.length && (seg[k] === '_' || seg[k] === '^')) {
            k++;
            if (k < seg.length && seg[k] === '{') {
              k = readBraceGroup(seg, k);
            } else {
              // single token: consume until whitespace or special char
              while (k < seg.length && !/[\s{$\\]/.test(seg[k])) k++;
            }
            changed = true;
          }
        }
        out += '$' + seg.slice(i, k) + '$';
        i = k;
        continue;
      }
    }
    out += seg[i];
    i++;
  }
  return out;
}

function normalizeMathMarkdown(input: string): string {
  if (!input) return '';

  // Fix doubled escaping like \\( ... \\) → \( ... \)
  let s = input.replace(/\\\\/g, '\\');

  // Convert \[ \] block math → $$ $$
  s = s.replace(/\\\[/g, '\n$$\n').replace(/\\\]/g, '\n$$\n');

  // Convert \( \) inline math → $ $
  s = s.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // Wrap bare LaTeX commands only in non-math segments
  // (split preserves the $...$ delimiters so we skip those)
  const parts = s.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  s = parts.map((part, i) => (i % 2 === 0 ? wrapBareLaTeX(part) : part)).join('');

  return s;
}

function QuizText({ text, className }: { text: string; className?: string }) {
  const md = useMemo(() => normalizeMathMarkdown(text), [text]);
  return (
    <div className={cn(
      'prose prose-sm max-w-none break-words dark:prose-invert',
      // Fix for "red text" readability: Override code styles
      'prose-code:text-violet-600 dark:prose-code:text-violet-300',
      'prose-code:bg-violet-50 dark:prose-code:bg-violet-900/30',
      'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
      'prose-code:before:content-none prose-code:after:content-none', // Remove backticks
      'prose-p:leading-normal',
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
        {md}
      </ReactMarkdown>
    </div>
  );
}

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

export default function QuizPage() {
  const { sessionId, quizId } = useParams<{ sessionId?: string; quizId?: string }>();
  const [step, setStep] = useState<'generate' | 'quiz' | 'result'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    details: Array<{
      questionId: string;
      question: string;
      options: string[];
      selectedOption: number | null;
      correctOption: number | null;
      isCorrect: boolean;
      explanation?: string;
    }>;
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleGenerate = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/quiz/generate', {
        sessionId,
        count: 5,
        difficulty: 'easy',
      });
      const quizId = data.quiz?.id ?? data.quiz?._id;
      if (!quizId) throw new Error('No quiz ID returned');

      const getRes = await api.get(`/quiz/${quizId}`);
      const q = getRes.data.quiz;

      // Filter to MCQ only
      if (q?.questions) {
        q.questions = q.questions
          .filter((qu: QuizQuestion) => qu.type === 'mcq')
          .map((qu: { _id?: string; id?: string;[key: string]: unknown }) => ({
            ...qu,
            // Normalize: always expose as `id` for consistent keying
            id: (qu._id ?? qu.id ?? '') as string,
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
        questionId: q.id,
        // Only include answered questions; unanswered default to -1 (no match)
        selectedOption: answers[q.id] !== undefined ? answers[q.id] : -1,
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

  const setAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;
  const currentQ = quiz?.questions[currentQuestion];
  const isLastQuestion = quiz && currentQuestion === quiz.questions.length - 1;
  const allAnswered = quiz && quiz.questions.every(q => answers[q.id] !== undefined);

  if (!sessionId && !quizId && step === 'generate') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--background))] p-4 transition-all">
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

  // Effect to load an existing quiz if accessed directly via URL (from QuizBox)
  useEffect(() => {
    const loadQuizFromUrl = async () => {
      if (quizId) {
        try {
          setLoading(true);
          const { data } = await api.get(`/quiz/${quizId}`);
          if (data.quiz) {
            let q = data.quiz;
            if (q.questions) {
              q.questions = q.questions
                .filter((qu: QuizQuestion) => qu.type === 'mcq')
                .map((qu: { _id?: string; id?: string;[key: string]: unknown }) => ({
                  ...qu,
                  id: (qu._id ?? qu.id ?? '') as string,
                }));
            }
            setQuiz(q);
            setStep('quiz');
            setAnswers({});
            setCurrentQuestion(0);
          }
        } catch (err) {
          setError('Failed to load quiz.');
        } finally {
          setLoading(false);
        }
      }
    };
    if (step === 'generate' && quizId) {
      loadQuizFromUrl();
    }
  }, [quizId, step]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back button */}
        {(sessionId || quiz) && (
          <Link
            to={sessionId ? `/chat/${sessionId}` : '/chat'}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground-tertiary))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {sessionId ? 'Back to Chat' : 'Back to Dashboard'}
          </Link>
        )}

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
            <div className="glass rounded-2xl border border-[hsl(var(--glass-border))] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-2xl text-[hsl(var(--foreground))]">{quiz.title}</CardTitle>
                <Badge variant="primary" size="lg">
                  {currentQuestion + 1} / {quiz.questions.length}
                </Badge>
              </div>
              <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

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
                    <QuizText text={currentQ.question} />
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
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-light))] shadow-md'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]'
                        )}
                      >
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0',
                          isSelected
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]'
                            : 'border-[hsl(var(--border-hover))]'
                        )}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={cn(
                          'font-medium text-[hsl(var(--foreground))]'
                        )}>
                          <QuizText text={opt} className="prose-p:my-0" />
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
                      <div className="text-4xl font-bold text-white leading-none">{result.percentage}%</div>
                      <div className="mt-1 text-sm font-semibold text-violet-100">Score</div>
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
                  {(result.details || []).map((d, idx) => {
                    const userAnswer = d.selectedOption;
                    const correctAnswer = d.correctOption;
                    const isCorrect = !!d.isCorrect;
                    const yourText = userAnswer !== null && userAnswer !== undefined ? d.options?.[userAnswer] : null;
                    const correctText = correctAnswer !== null && correctAnswer !== undefined ? d.options?.[correctAnswer] : null;

                    return (
                      <div
                        key={d.questionId}
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
                              {idx + 1}. <QuizText text={d.question} className="prose-p:my-0" />
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Your answer: <strong>{yourText ? yourText : 'Not answered'}</strong>
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                              Correct answer: <strong>{correctText ? correctText : '—'}</strong>
                            </p>

                            <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Solution
                              </p>
                              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                <QuizText text={d.explanation || 'Review the concept from the chat solution and try again.'} className="prose-p:my-0" />
                              </div>
                            </div>
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
