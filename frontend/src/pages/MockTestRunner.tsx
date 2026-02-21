import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Save, LayoutGrid, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import api from '../lib/api';
import { cn } from '../lib/utils';
import Logo from '../components/ui/Logo';

export default function MockTestRunner() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<any>(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | string | null)[]>([]);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPalette, setShowPalette] = useState(false);

    const [activeSubject, setActiveSubject] = useState<string | null>(null);

    useEffect(() => {
        api.get(`/mock-tests/${id}`)
            .then(res => {
                const t = res.data.test;
                if (t.status === 'completed') {
                    navigate(`/mock-tests/${id}/result`); // already submitted
                    return;
                }
                setTest(t);

                // initialize answers array
                const initialAnswers = t.questions.map((q: any) => q.userAnswerIndex !== undefined ? q.userAnswerIndex : null);
                setAnswers(initialAnswers);

                // Initialize active subject if available
                if (t.questions.length > 0 && t.questions[0].subject) {
                    setActiveSubject(t.questions[0].subject);
                }

                // Calculate remaining time
                const elapsed = (Date.now() - new Date(t.createdAt).getTime()) / 1000;
                const totalSecs = t.durationMinutes * 60;
                const remain = Math.max(0, Math.floor(totalSecs - elapsed));
                setTimeLeft(remain);
            })
            .catch(err => {
                setError(err.response?.data?.error?.message || 'Failed to load test');
            });
    }, [id, navigate]);

    // Timer Tick
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || !test) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev ? prev - 1 : 0;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, test]);

    // Use useCallback so it can be called safely from useEffect
    const handleAutoSubmit = useCallback(async () => {
        if (isSubmitting) return;
        handleSubmit(true);
    }, [isSubmitting, answers]);

    const handleSubmit = async (isAuto = false) => {
        if (!isAuto) {
            const confirmSubmit = window.confirm("Are you sure you want to submit the test? You cannot change answers after submitting.");
            if (!confirmSubmit) return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/mock-tests/${id}/submit`, { answers });
            navigate(`/mock-tests/${id}/result`);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Submission failed');
            setIsSubmitting(false);
        }
    };

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQ] = optIndex;
        setAnswers(newAnswers);
    };

    const handleNumericalChange = (val: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQ] = val;
        setAnswers(newAnswers);
    };

    const handleClearResponse = () => {
        const newAnswers = [...answers];
        newAnswers[currentQ] = null;
        setAnswers(newAnswers);
    };

    const handleNavigateQuestion = (newIndex: number) => {
        setCurrentQ(newIndex);
        if (test?.questions[newIndex]?.subject) {
            setActiveSubject(test.questions[newIndex].subject);
        }
    };

    const handleSubjectClick = (subject: string) => {
        setActiveSubject(subject);
        // Find the first question of this subject and jump to it
        const firstIndex = test.questions.findIndex((q: any) => q.subject === subject);
        if (firstIndex !== -1) {
            setCurrentQ(firstIndex);
        }
        setShowPalette(false);
    };

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))] p-6 text-center">
                <div className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-6 rounded-2xl max-w-md w-full shadow-lg">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-80" />
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/mock-tests')} className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">Return to Portal</button>
                </div>
            </div>
        );
    }

    if (!test || timeLeft === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
                <div className="flex flex-col items-center text-slate-500 animate-pulse">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-violet-500" />
                    <p className="font-semibold tracking-widest uppercase">Initializing CBT Engine...</p>
                </div>
            </div>
        );
    }

    const question = test.questions[currentQ];
    const attemptedCount = answers.filter(a => a !== null).length;

    // Derive unique subjects for tabs
    const uniqueSubjects = Array.from(new Set(test.questions.map((q: any) => q.subject).filter(Boolean))) as string[];

    return (
        <div className="flex flex-col h-screen bg-[hsl(var(--background))] overflow-hidden select-none">
            {/* Top Bar */}
            <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shadow-md z-10 relative">
                <div className="flex items-center gap-4">
                    <Logo />
                    <span className="hidden sm:inline font-black tracking-widest text-[10px] uppercase text-slate-400 bg-slate-800 px-2 py-1 rounded">CBT MODE</span>
                </div>
                <div className="font-bold tracking-tight">{test.title}</div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPalette(!showPalette)}
                        className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>

                    <div className={cn(
                        "flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-lg border",
                        timeLeft < 300
                            ? "bg-red-900/50 text-red-400 border-red-500/50 animate-pulse"
                            : "bg-slate-800 text-slate-200 border-slate-700"
                    )}>
                        <Clock className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* Subject Tabs */}
            {uniqueSubjects.length > 0 && (
                <div className="flex bg-slate-800 border-b border-slate-700 px-4 overflow-x-auto custom-scrollbar shrink-0">
                    {uniqueSubjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => handleSubjectClick(subject)}
                            className={cn(
                                "px-6 py-3 font-bold text-sm tracking-wide whitespace-nowrap transition-colors border-b-2",
                                activeSubject === subject
                                    ? "text-violet-400 border-violet-500 bg-slate-900/50"
                                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50"
                            )}
                        >
                            {subject}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-1 min-h-0 bg-slate-50 dark:bg-[#0B1121]">
                {/* Main Test Area */}
                <main className="flex-1 flex flex-col min-w-0">

                    {/* Question Header */}
                    <div className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0F172A] flex items-center justify-between px-6 shadow-sm z-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Question {currentQ + 1}</h2>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                question.difficulty === 'easy' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    question.difficulty === 'hard' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>{question.difficulty}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:block">Topic: {question.topic}</p>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <div className="max-w-4xl mx-auto">
                            <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 rounded-xl mb-10 text-lg sm:text-xl font-medium text-slate-800 dark:text-slate-200">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {question.text}
                                </ReactMarkdown>
                            </div>

                            <div className="space-y-4">
                                {question.options && question.options.length > 0 ? (
                                    question.options.map((opt: string, i: number) => {
                                        const isSelected = answers[currentQ] === i;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleOptionSelect(i)}
                                                className={cn(
                                                    "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 group",
                                                    isSelected
                                                        ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500 shadow-sm"
                                                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B] dark:hover:border-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex shrink-0 h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors mt-0.5",
                                                    isSelected
                                                        ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500"
                                                        : "border-slate-300 text-slate-500 group-hover:border-violet-400 dark:border-slate-600 dark:text-slate-400"
                                                )}>
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none mt-1">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {opt}
                                                    </ReactMarkdown>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-widest uppercase">Numerical Value Answer</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Enter numerical answer..."
                                            value={answers[currentQ] !== null ? String(answers[currentQ]) : ''}
                                            onChange={(e) => handleNumericalChange(e.target.value)}
                                            className="w-full text-lg p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 transition-all text-slate-900 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Please enter exact numerical value up to 2 decimal places if applicable.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="h-20 shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex gap-3 text-sm">
                            <button
                                onClick={handleClearResponse}
                                disabled={answers[currentQ] === null}
                                className="px-4 py-2.5 rounded-lg border font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                            >
                                Clear Response
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleNavigateQuestion(Math.max(0, currentQ - 1))}
                                disabled={currentQ === 0}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border font-semibold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            {currentQ < test.questions.length - 1 ? (
                                <button
                                    onClick={() => handleNavigateQuestion(Math.min(test.questions.length - 1, currentQ + 1))}
                                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-bold bg-violet-600 text-white hover:bg-violet-700 transition shadow-md"
                                >
                                    Save & Next <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md disabled:opacity-70 disabled:animate-pulse"
                                >
                                    <Save className="h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Palette */}
                <aside className={cn(
                    "w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-col absolute md:relative right-0 h-full z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] transition-transform duration-300",
                    !showPalette && "translate-x-full md:translate-x-0"
                )}>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setShowPalette(false)}
                        className="md:hidden absolute -left-12 top-4 p-2 bg-slate-800 text-white rounded-l-lg shadow-md"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Question Palette</h3>

                        <div className="grid grid-cols-2 gap-3 text-xs font-semibold mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-emerald-500" /> <span className="text-slate-700 dark:text-slate-300">Answered ({attemptedCount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /> <span className="text-slate-700 dark:text-slate-300">Not Visited ({test.questions.length - attemptedCount})</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-3">
                            {test.questions.map((q: any, idx: number) => {
                                // Only render if no subjects exist or matches the active subject
                                if (activeSubject && q.subject && q.subject !== activeSubject) {
                                    return null;
                                }

                                const isAnswered = answers[idx] !== null;
                                const isCurrent = currentQ === idx;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            handleNavigateQuestion(idx);
                                            setShowPalette(false);
                                        }}
                                        className={cn(
                                            "aspect-square rounded flex items-center justify-center text-sm font-bold transition-all",
                                            isCurrent && "ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-slate-900",
                                            isAnswered
                                                ? "bg-emerald-500 text-white shadow-sm"
                                                : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition shadow-lg"
                        >
                            SUBMIT TEST
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
