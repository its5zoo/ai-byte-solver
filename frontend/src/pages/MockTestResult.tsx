import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Home, FileText, CheckCircle2, XCircle, ChevronRight, BarChart3, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '../lib/api';
import { cn } from '../lib/utils';
import Logo from '../components/ui/Logo';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function MockTestResult() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/mock-tests/${id}`)
            .then(res => {
                const t = res.data.test;
                if (t.status !== 'completed') {
                    navigate(`/mock-tests/${id}/take`);
                    return;
                }
                setTest(t);
            })
            .catch(err => setError(err.response?.data?.error?.message || 'Failed to load test result'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))] p-6 text-center">
                <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-6 rounded-2xl max-w-md w-full shadow-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-80" />
                    <p className="font-bold text-lg mb-4">{error || 'Test not found'}</p>
                    <button onClick={() => navigate('/mock-tests')} className="px-4 py-2 bg-red-600 text-white rounded-lg">Go Back</button>
                </div>
            </div>
        );
    }

    const attemptedCount = test.correctAnswers + test.incorrectAnswers;
    const unattemptedCount = test.totalQuestions - attemptedCount;
    const accuracy = attemptedCount > 0 ? Math.round((test.correctAnswers / attemptedCount) * 100) : 0;

    const pieData = [
        { name: 'Correct', value: test.correctAnswers, color: '#10b981' }, // emerald-500
        { name: 'Incorrect', value: test.incorrectAnswers, color: '#ef4444' }, // red-500
        { name: 'Unattempted', value: unattemptedCount, color: '#94a3b8' }, // slate-400
    ].filter(d => d.value > 0);

    return (
        <div className="flex flex-col min-h-screen bg-[hsl(var(--background))]">
            <header className="glass sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b px-6">
                <div className="flex items-center gap-4">
                    <Link to="/" className="hover:opacity-90 transition-opacity">
                        <Logo />
                    </Link>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Performance Report</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/mock-tests')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <Home className="h-4 w-4" /> Portal
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Score & Summary */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card className="bg-[hsl(var(--glass-bg))] border-[hsl(var(--glass-border))] overflow-hidden shadow-xl">
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-center text-white">
                                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-90 drop-shadow-md text-amber-300" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-white/80 mb-2">{test.title}</h2>
                                <div className="flex items-baseline justify-center gap-2 relative">
                                    <span className="text-7xl font-black tabular-nums tracking-tighter drop-shadow-lg">{test.score}</span>
                                    <span className="text-xl font-bold uppercase tracking-wider text-white/70">Marks</span>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{test.correctAnswers}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70 dark:text-emerald-500/70 mt-1">Correct</p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
                                        <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{test.incorrectAnswers}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-700/70 dark:text-red-500/70 mt-1">Incorrect</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Accuracy Pie Chart */}
                        <Card className="bg-[hsl(var(--glass-bg))] border-[hsl(var(--glass-border))]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-violet-500" /> Attempt Accuracy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-48 w-full relative mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-slate-800 dark:text-white">{accuracy}%</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hit Rate</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {pieData.map(d => (
                                        <div key={d.name} className="flex justify-between items-center text-sm font-semibold">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                                <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                                            </div>
                                            <span className="text-slate-900 dark:text-white">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Solutions */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <FileText className="h-6 w-6 text-violet-500" /> Question Solutions
                        </h3>

                        <div className="space-y-6">
                            {test.questions.map((q: any, i: number) => {
                                const isAttempted = q.userAnswerIndex !== null;
                                const isCorrect = isAttempted && q.userAnswerIndex === q.correctAnswerIndex;

                                return (
                                    <Card key={i} className={cn(
                                        "overflow-hidden border-l-4 transition-all hover:shadow-md",
                                        !isAttempted ? "border-l-slate-400 dark:border-l-slate-600 bg-white dark:bg-slate-900/50" :
                                            isCorrect ? "border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/5" :
                                                "border-l-red-500 bg-red-50/30 dark:bg-red-900/5"
                                    )}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-black text-slate-700 dark:text-slate-300">
                                                        Q{i + 1}
                                                    </span>
                                                    {!isAttempted ? (
                                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Unattempted</span>
                                                    ) : isCorrect ? (
                                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Correct</span>
                                                    ) : (
                                                        <span className="text-xs font-bold uppercase tracking-widest text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Incorrect</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{q.topic}</span>
                                            </div>

                                            <div className="prose prose-slate dark:prose-invert max-w-none text-base mb-6 font-medium">
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{q.text}</ReactMarkdown>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                                {q.options.map((opt: string, optIdx: number) => {
                                                    const isUserChoice = optIdx === q.userAnswerIndex;
                                                    const isActualCorrect = optIdx === q.correctAnswerIndex;

                                                    let styleClass = "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 opacity-70";
                                                    if (isActualCorrect) {
                                                        styleClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm ring-1 ring-emerald-500/50";
                                                    } else if (isUserChoice && !isActualCorrect) {
                                                        styleClass = "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm ring-1 ring-red-500/50";
                                                    }

                                                    return (
                                                        <div key={optIdx} className={cn("flex items-start gap-3 p-3 rounded-xl border-2 transition-all", styleClass)}>
                                                            <div className={cn(
                                                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1",
                                                                isActualCorrect ? "bg-emerald-500 text-white" :
                                                                    (isUserChoice && !isActualCorrect) ? "bg-red-500 text-white" :
                                                                        "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                                            )}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown>
                                                            </div>

                                                            {/* Status Icon Indicator relative to the option block */}
                                                            <div className="ml-auto mt-1 shrink-0">
                                                                {isActualCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                                                {(isUserChoice && !isActualCorrect) && <XCircle className="h-5 w-5 text-red-500" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5">
                                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-400 mb-2">
                                                    AI Explanation
                                                </h4>
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-indigo-900/80 dark:text-indigo-200/80">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{q.explanation}</ReactMarkdown>
                                                </div>
                                            </div>

                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
