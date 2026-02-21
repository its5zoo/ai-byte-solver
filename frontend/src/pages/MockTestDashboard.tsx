import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Search, Trophy, Loader2, Play, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import Logo from '../components/ui/Logo';
import { Card, CardContent } from '../components/ui/Card';

const EXAMS = [
    {
        id: 'jee-main',
        title: 'JEE Main (NTA)',
        description: 'National Level Engineering Entrance',
        subjects: 'Physics, Chemistry, Mathematics',
        duration: 180,
        questions: 75, // Full Mock
        positive: '+4',
        negative: '-1',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'neet',
        title: 'NEET (UG)',
        description: 'National Level Medical Entrance',
        subjects: 'Physics, Chemistry, Biology',
        duration: 180,
        questions: 180,
        positive: '+4',
        negative: '-1',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'upsc',
        title: 'UPSC Civil Services',
        description: 'Preliminary Examination',
        subjects: 'History, Polity, Geography, Economy',
        duration: 120,
        questions: 100,
        positive: '+2',
        negative: '-0.66',
        color: 'from-violet-500 to-purple-500'
    },
    {
        id: 'gate',
        title: 'GATE',
        description: 'Graduate Aptitude Test in Engg.',
        subjects: 'Core Subject + Aptitude + Math',
        duration: 180,
        questions: 65,
        positive: '+2',
        negative: '-0.66',
        color: 'from-orange-500 to-red-500'
    }
];

export default function MockTestDashboard() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        api.get('/mock-tests')
            .then(res => {
                setHistory(res.data.tests || []);
            })
            .catch(err => {
                console.error("Failed to load history", err);
            })
            .finally(() => setLoadingHistory(false));
    }, []);

    const handleGenerate = async (examId: string) => {
        setIsGenerating(examId);
        setError(null);
        try {
            const { data } = await api.post('/mock-tests/generate', { examId });
            // Redirect to the taking UI
            navigate(`/mock-tests/${data.test._id}/take`);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to generate mock test');
            setIsGenerating(null);
        }
    };

    const filteredExams = EXAMS.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.subjects.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-screen flex-col bg-[hsl(var(--background))] overflow-y-auto">
            <header className="glass sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b px-6">
                <div className="flex items-center gap-4">
                    <Link to="/" className="hover:opacity-90 transition-opacity">
                        <Logo />
                    </Link>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Mock Exam Portal</h1>
                </div>
                <Link to="/chat" className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
                    Back to Dashboard
                </Link>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
                {/* Search & Intro */}
                <section className="text-center space-y-6 max-w-2xl mx-auto pt-8">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Generate Authentic <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">PYQ Papers</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Dynamically generated standard mock tests matching exact exam patterns, timings, and negative marking constraints.
                    </p>

                    <div className="relative max-w-xl mx-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search exams (e.g., JEE, NEET, UPSC)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] text-lg shadow-sm focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 transition-all dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-semibold animate-fade-in">
                            {error}
                        </div>
                    )}
                </section>

                {/* Exams Grid */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {filteredExams.map(exam => (
                            <Card key={exam.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))]">
                                <div className={cn("absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b", exam.color)} />
                                <CardContent className="p-6 sm:p-8 flex flex-col h-full pl-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{exam.title}</h3>
                                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">{exam.description}</p>
                                        </div>
                                        <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", exam.color)}>
                                            <BookOpen className="h-6 w-6" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 my-6 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Duration</p>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.duration} Mins</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><HelpCircle className="h-4 w-4" /> Questions</p>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.questions} {(exam.id === 'jee-main' || exam.id === 'neet' || exam.id === 'upsc' || exam.id === 'gate') ? '(Full Mock)' : '(Mini Mock)'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Correct</p>
                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{exam.positive} Marks</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Incorrect</p>
                                            <p className="font-semibold text-red-600 dark:text-red-400">{exam.negative} Marks</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Syllabus:</span> {exam.subjects}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => handleGenerate(exam.id)}
                                            disabled={isGenerating !== null}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                        >
                                            {isGenerating === exam.id ? (
                                                <><Loader2 className="h-5 w-5 animate-spin" /> Generating Paper...</>
                                            ) : (
                                                <><Play className="h-5 w-5 fill-current" /> Initialize CBT Engine</>
                                            )}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* History Section */}
                <section className="pt-10 border-t border-[hsl(var(--glass-border))]">
                    <div className="flex items-center gap-3 mb-6">
                        <Trophy className="h-6 w-6 text-amber-500" />
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Previous Attempts</h2>
                    </div>

                    {loadingHistory ? (
                        <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 text-violet-500 animate-spin" /></div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 bg-[hsl(var(--glass-bg))] border border-[hsl(var(--glass-border))] rounded-2xl">
                            <p className="text-slate-500 dark:text-slate-400">No mock tests attempted yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {history.map(test => (
                                <Link key={test._id} to={`/mock-tests/${test._id}/${test.status === 'completed' ? 'result' : 'take'}`} className="block">
                                    <Card className="hover:border-violet-500 hover:shadow-md transition-colors h-full bg-[hsl(var(--glass-bg))] border-[hsl(var(--glass-border))]">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{test.title}</h4>
                                                {test.status === 'completed' ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Complete</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">In Progress</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">{new Date(test.createdAt).toLocaleDateString()}</p>

                                            {test.status === 'completed' && (
                                                <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                                                    <span className="text-slate-600 dark:text-slate-400">Score</span>
                                                    <span className="font-black text-violet-600 dark:text-violet-400">{test.score} <span className="text-xs text-slate-400">Marks</span></span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
