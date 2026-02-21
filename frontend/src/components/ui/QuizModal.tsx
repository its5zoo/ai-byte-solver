import { useState, useEffect } from 'react';
import { GraduationCap, MessageSquare, Globe } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    topics: { topic: string; count: number }[];
}

export default function QuizModal({ isOpen, onClose, topics }: QuizModalProps) {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'chat' | 'general'>('chat');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('medium');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // Reset state when opened or mode changed
    useEffect(() => {
        setError('');
    }, [isOpen, mode]);

    const handleGenerate = async () => {
        if (!subject.trim() || !topic.trim()) {
            setError('Subject and Topic are required.');
            return;
        }

        if (mode === 'chat') {
            // Basic validation: Check if topic or subject matches any of our known topics loosely
            const combinedTopicsStr = topics.map(t => t.topic.toLowerCase()).join(' ');
            const subjectMatch = combinedTopicsStr.includes(subject.toLowerCase());
            const topicMatch = combinedTopicsStr.includes(topic.toLowerCase());

            if (!subjectMatch && !topicMatch) {
                setError('No subject found in your chats. If you wish, you can switch to the General quiz mode.');
                return;
            }
        }

        setGenerating(true);
        setError('');

        try {
            const { data } = await api.post('/quiz/custom-generate', {
                subject: subject.trim(),
                topic: topic.trim(),
                level,
                count: 5,
                mode
            });
            const quizId = data.quiz?.id || data.quiz?._id;
            if (quizId) {
                onClose(); // Close modal
                navigate(`/quiz/${quizId}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to generate quiz.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="relative p-6 pt-5">
                {/* Toggle Switch */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--foreground))]">
                        <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" />
                        Practice Quiz
                    </h2>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                        <button
                            onClick={() => setMode('chat')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                mode === 'chat'
                                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                        </button>
                        <button
                            onClick={() => setMode('general')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                mode === 'general'
                                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            General
                        </button>
                    </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                    {mode === 'chat'
                        ? "Take a quiz based on topics you've discussed with the AI."
                        : "Generate a quiz on any subject or topic."}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                        <input
                            type="text"
                            placeholder="e.g. Physics, Chemistry, English"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full text-sm rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[hsl(var(--primary))] transition-colors shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Topic</label>
                        <input
                            type="text"
                            placeholder="e.g. Thermodynamics, Shakespeare"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full text-sm rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[hsl(var(--primary))] transition-colors shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Level</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full text-sm rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[hsl(var(--primary))] transition-colors shadow-sm appearance-none"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 animate-shake flex gap-2 items-start mt-2">
                            <span className="block mt-0.5">⚠️</span>
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={generating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            loading={generating}
                            disabled={generating}
                            variant="primary"
                            className="w-full sm:w-auto px-8"
                        >
                            Start 5-Q Quiz
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
