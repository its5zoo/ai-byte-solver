import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, FolderOpen, Loader2, Code2, Plus, Filter } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface IdeProject {
    _id: string;
    name: string;
    description: string;
    language: string;
    updatedAt: string;
    createdAt: string;
}

const LANGUAGES = ['all', 'javascript', 'typescript', 'python', 'cpp', 'java', 'html', 'css'];

export default function IDEHistory() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<IdeProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/ide/projects');
            setProjects(data.projects || []);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await api.delete(`/ide/projects/${id}`);
            setProjects((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = projects
        .filter((p) => {
            const q = search.toLowerCase();
            const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
            const matchesLang = languageFilter === 'all' || p.language === languageFilter;
            return matchesSearch && matchesLang;
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const langColor: Record<string, string> = {
        javascript: 'text-yellow-400 bg-yellow-400/10',
        typescript: 'text-blue-400 bg-blue-400/10',
        python: 'text-emerald-400 bg-emerald-400/10',
        cpp: 'text-purple-400 bg-purple-400/10',
        java: 'text-orange-400 bg-orange-400/10',
        html: 'text-red-400 bg-red-400/10',
        css: 'text-pink-400 bg-pink-400/10',
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-mono">
            {/* Header */}
            <div className="border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ide')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Code2 className="h-5 w-5 text-[#6366f1]" />
                        <span className="text-lg font-bold text-white">IDE History</span>
                    </button>
                </div>
                <button
                    onClick={() => navigate('/ide')}
                    className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4f52d4]"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-[#1e293b] flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search projects…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-[#1e293b] bg-[#1e293b] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <div className="flex flex-wrap gap-1.5">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguageFilter(lang)}
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                                    languageFilter === lang
                                        ? 'bg-[#6366f1] text-white'
                                        : 'bg-[#1e293b] text-slate-400 hover:text-white'
                                )}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4">📂</div>
                        <p className="text-slate-400 text-sm">
                            {search || languageFilter !== 'all'
                                ? 'No projects match your filters.'
                                : 'No projects yet. Create one in the IDE!'}
                        </p>
                        {(search || languageFilter !== 'all') && (
                            <button
                                onClick={() => { setSearch(''); setLanguageFilter('all'); }}
                                className="mt-3 text-xs text-[#6366f1] hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((p) => (
                            <div
                                key={p._id}
                                className="group relative flex flex-col rounded-xl border border-[#1e293b] bg-[#1e293b]/50 p-4 transition-all hover:border-[#6366f1]/50 hover:bg-[#1e293b]"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-semibold text-white truncate flex-1">{p.name}</h3>
                                    <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase', langColor[p.language] || 'text-slate-400 bg-slate-400/10')}>
                                        {p.language}
                                    </span>
                                </div>
                                {p.description && (
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>
                                )}
                                <div className="mt-auto pt-2 border-t border-[#334155] flex items-center justify-between">
                                    <span className="text-[10px] text-slate-600">
                                        {new Date(p.updatedAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            disabled={deletingId === p._id}
                                            className="rounded p-1 text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            {deletingId === p._id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Trash2 className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => navigate(`/ide/${p._id}`)}
                                            className="flex items-center gap-1 rounded bg-[#6366f1] px-2 py-1 text-xs text-white transition hover:bg-[#4f52d4]"
                                        >
                                            <FolderOpen className="h-3 w-3" />
                                            Open
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
