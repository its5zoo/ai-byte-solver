import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ChevronDown, FileCode, Keyboard, ArrowRight, Plus, LayoutDashboard, User, Terminal as TerminalIcon } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '../lib/utils';
import IDESidebar from '../components/ide/IDESidebar';
import CodeEditor from '../components/ide/CodeEditor';
import AIAssistantPanel from '../components/ide/AIAssistantPanel';
import Terminal from '../components/ide/Terminal';
import { useIdeStore } from '../stores/ideStore';
import api from '../lib/api';
import { AILogo } from '../components/ui/AILogo';

export default function IDEPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId?: string }>();

    const {
        activeProjectId, setActiveProject, openTabs, activeTabId,
        openTab, renameTab, closeAllTabs,
        addToRecentFiles, updateTabContent, markTabSaved,
    } = useIdeStore();

    const [files, setFiles] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [terminalOpen, setTerminalOpen] = useState(true);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const effectiveProjectId = projectId || activeProjectId;

    const loadProject = useCallback(async (id: string) => {
        setIsLoadingProject(true);
        closeAllTabs();
        try {
            const { data } = await api.get(`/ide/projects/${id}`);
            setProject(data.project);
            setFiles(data.files || []);
            setActiveProject(id);

            const lastId = data.project.lastOpenFileId;
            const fileToOpen = (lastId && data.files?.find((f: any) => f._id === lastId)) || data.files?.[0];

            if (fileToOpen) {
                openTab(fileToOpen);
                addToRecentFiles(fileToOpen._id);
            }
        } catch (err) {
            console.error('Failed to load project', err);
        } finally {
            setIsLoadingProject(false);
        }
    }, [setActiveProject, openTab, closeAllTabs, addToRecentFiles]);

    useEffect(() => {
        if (effectiveProjectId) {
            loadProject(effectiveProjectId);
        }
    }, [effectiveProjectId, loadProject]);

    useEffect(() => {
        if (activeTabId) {
            const tab = openTabs.find(t => t.fileId === activeTabId);
            if (tab) {
                addToRecentFiles({ _id: tab.fileId, name: tab.name, language: tab.language, path: '', content: tab.content, project: '' });
            }
            if (effectiveProjectId) {
                api.put(`/ide/projects/${effectiveProjectId}/state`, { lastOpenFileId: activeTabId })
                    .catch(e => console.error('Failed to save project state', e));
            }
        }
    }, [activeTabId, effectiveProjectId, addToRecentFiles, openTabs]);

    const handleSaveFile = async (fileId: string, content: string) => {
        if (!effectiveProjectId) return;
        try {
            await api.put(`/ide/projects/${effectiveProjectId}/files/${fileId}`, { content });
            markTabSaved(fileId);
            setFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, content } : f));
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleCreateFile = async (name: string, content?: string) => {
        if (!effectiveProjectId) return;
        try {
            const { data } = await api.post(`/ide/projects/${effectiveProjectId}/files`, { name, content });
            setFiles((prev) => [...prev, data.file]);
            openTab(data.file);
        } catch (err: any) {
            console.error('Create file failed', err.message);
        }
    };

    const activeTab = openTabs.find((t) => t.fileId === activeTabId);
    const activeFile = files.find((f) => f._id === activeTabId);

    const languages = [
        { id: 'c', label: 'C' },
        { id: 'cpp', label: 'C++' },
        { id: 'javascript', label: 'JavaScript' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'python', label: 'Python' },
        { id: 'java', label: 'Java' },
        { id: 'markdown', label: 'Markdown' },
    ];

    const handleLanguageChange = async (lang: string) => {
        if (!effectiveProjectId) return;
        try {
            if (activeTabId) {
                // Update specific file
                const { data } = await api.put(`/ide/projects/${effectiveProjectId}/files/${activeTabId}`, { language: lang });
                setFiles((prev) => prev.map((f) => f._id === activeTabId ? data.file : f));
                renameTab(activeTabId, data.file.name, lang);
            } else {
                // Update project default language (for Direct Entry mode)
                await api.put(`/ide/projects/${effectiveProjectId}/state`, { language: lang });
                setProject((prev: any) => ({ ...prev, language: lang }));
            }
        } catch (err) {
            console.error('Language change failed', err);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0f172a] text-white">
            <IDESidebar onClose={() => navigate('/chat')} />

            <PanelGroup direction="horizontal">
                <Panel defaultSize={75} minSize={30} className="flex flex-col">
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={75} minSize={20} className="flex flex-col overflow-hidden bg-[#0f172a]">
                            {/* Header */}
                            <div className="flex items-center border-b border-[#1e293b] bg-[#0a0f1e] min-h-[48px] shrink-0">
                                {effectiveProjectId && (
                                    <div className="relative border-r border-[#1e293b]">
                                        <button
                                            onClick={() => setLangMenuOpen(!langMenuOpen)}
                                            className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors active:scale-95"
                                        >
                                            {languages.find(l => l.id === (activeTab?.language || project?.language || 'text'))?.label || 'Text'}
                                            <ChevronDown className={cn("h-3 w-3 transition-transform", langMenuOpen ? "rotate-180" : "")} />
                                        </button>

                                        {langMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                                                <div className="absolute top-full left-0 mt-1 w-48 bg-[#0a0f1e] border border-[#1e293b] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {languages.map(l => (
                                                        <button
                                                            key={l.id}
                                                            onClick={() => {
                                                                handleLanguageChange(l.id);
                                                                setLangMenuOpen(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                                                (activeTab?.language || project?.language || 'text') === l.id
                                                                    ? "text-indigo-400 bg-indigo-500/5"
                                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                                            )}
                                                        >
                                                            {l.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="px-4 text-[11px] font-bold text-slate-400 truncate">
                                    {project?.name || ''} {activeTab ? ` / ${activeTab.name}` : ''}
                                </div>

                                <div className="flex-1" />

                                <div className="px-4 flex items-center gap-6">
                                    <button
                                        onClick={() => navigate('/chat')}
                                        className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
                                    >
                                        <LayoutDashboard className="h-3.5 w-3.5" />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Profile
                                    </button>
                                </div>

                                <button
                                    onClick={() => setTerminalOpen(!terminalOpen)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-l border-[#1e293b] shrink-0 bg-transparent active:scale-95",
                                        terminalOpen ? "text-indigo-400 bg-indigo-500/5 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <TerminalIcon className="h-3.5 w-3.5" />
                                    Terminal
                                </button>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 relative overflow-hidden">
                                {isLoadingProject ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : !effectiveProjectId ? (
                                    <NoProjectState />
                                ) : !activeTab ? (
                                    <div className="flex h-full flex-col bg-[#0f172a]">
                                        <div className="flex-1 p-4">
                                            {(() => {
                                                const currentLangId = project?.language || 'c';
                                                const currentLang = languages.find(l => l.id === currentLangId);
                                                const getExt = (id: string) => {
                                                    switch (id) {
                                                        case 'javascript': return 'js';
                                                        case 'typescript': return 'ts';
                                                        case 'python': return 'py';
                                                        case 'cpp': return 'cpp';
                                                        case 'c': return 'c';
                                                        case 'java': return 'java';
                                                        case 'markdown': return 'md';
                                                        default: return 'txt';
                                                    }
                                                };
                                                const ext = getExt(currentLangId);

                                                return (
                                                    <textarea
                                                        className="w-full h-full bg-transparent text-slate-300 font-mono text-sm resize-none outline-none placeholder:text-slate-600"
                                                        placeholder={`// Start writing your ${currentLang?.label || 'C'} code here...\n// AI will automatically save this as index.${ext}`}
                                                        onChange={(e) => {
                                                            const content = e.target.value;
                                                            if (content.trim().length > 0) {
                                                                handleCreateFile(`index.${ext}`, content);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                Direct Writing Mode Active
                                            </div>
                                            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Your code will be saved automatically</p>
                                        </div>
                                    </div>
                                ) : (
                                    <CodeEditor
                                        key={activeTab.fileId}
                                        fileId={activeTab.fileId}
                                        language={activeTab.language}
                                        content={activeTab.content}
                                        onChange={(content) => updateTabContent(activeTab.fileId, content)}
                                        onSave={(content) => handleSaveFile(activeTab.fileId, content)}
                                    />
                                )}
                            </div>
                        </Panel>

                        {terminalOpen && (
                            <>
                                <PanelResizeHandle className="h-1 bg-[#1e293b] hover:bg-indigo-500 transition-colors" />
                                <Panel defaultSize={25} minSize={10} className="border-t border-[#1e293b] flex flex-col overflow-hidden">
                                    <div className="flex items-center px-3 py-1 bg-[#0a0f1e] border-b border-[#1e293b] shrink-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-1">Terminal</span>
                                        <button
                                            onClick={() => setTerminalOpen(false)}
                                            className="p-1 text-slate-400 hover:text-white"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <Terminal activeFile={activeFile || null} />
                                    </div>
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#1e293b] hover:bg-indigo-500 transition-colors" />

                <Panel defaultSize={25} minSize={20} maxSize={40} className="border-l border-[#1e293b] bg-[#0f172a] overflow-hidden">
                    <AIAssistantPanel
                        files={files}
                        activeFile={activeFile || null}
                        onCreateFile={handleCreateFile}
                    />
                </Panel>
            </PanelGroup>
        </div>
    );
}

function NoProjectState() {
    const navigate = useNavigate();
    const { setProjects } = useIdeStore();
    const [projects, setLocalProjects] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/ide/projects').then(({ data }) => {
            setLocalProjects(data.projects || []);
            setProjects(data.projects || []);
        }).catch(console.error);
    }, [setProjects]);

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setError('');
        setIsCreating(true);
        try {
            const { data } = await api.post('/ide/projects', { name });
            navigate(`/ide/${data.project._id}`);
        } catch (err: any) {
            setError(err?.response?.data?.error?.message || 'Failed to create project');
        } finally {
            setIsCreating(false);
        }
    };

    const getLangIcon = (lang: string) => {
        switch (lang?.toLowerCase()) {
            case 'javascript':
            case 'js': return <div className="p-1.5 rounded-md bg-yellow-400/10 text-yellow-500 font-bold text-[10px]">JS</div>;
            case 'typescript':
            case 'ts': return <div className="p-1.5 rounded-md bg-blue-400/10 text-blue-500 font-bold text-[10px]">TS</div>;
            case 'cpp':
            case 'c++': return <div className="p-1.5 rounded-md bg-indigo-400/10 text-indigo-500 font-bold text-[10px]">C++</div>;
            case 'python':
            case 'py': return <div className="p-1.5 rounded-md bg-emerald-400/10 text-emerald-500 font-bold text-[10px]">PY</div>;
            default: return <FileCode className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="flex h-full flex-col items-center justify-center p-6 bg-[#0f172a]">
            <div className="w-full max-w-2xl bg-[#111827] rounded-3xl p-10 flex flex-col items-center border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="mb-8 relative z-10 h-24 w-24">
                    <AILogo className="w-full h-full" />
                </div>

                <h2 className="mb-3 text-3xl font-extrabold text-white tracking-tight relative z-10 text-center">Welcome to AI Byte IDE</h2>
                <p className="mb-10 text-base text-slate-300 max-w-md text-center relative z-10">
                    Create a new project or select one from below.
                </p>

                <div className="w-full max-w-lg space-y-8 relative z-10">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Project name..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-3.5 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Keyboard className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !newName.trim()}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Create
                            </button>
                        </div>
                        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    </div>

                    {projects.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Projects</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {projects.slice(0, 4).map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => navigate(`/ide/${p._id}`)}
                                        className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            {getLangIcon(p.language)}
                                            <ArrowRight className="h-3 w-3 text-slate-600" />
                                        </div>
                                        <div className="font-bold text-white text-sm truncate">{p.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
