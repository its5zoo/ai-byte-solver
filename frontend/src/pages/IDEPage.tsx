import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Loader2, ChevronDown, History, FolderOpen, FileCode, Keyboard, ArrowRight, Plus, Terminal as TerminalIcon } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '../lib/utils';
import IDESidebar from '../components/ide/IDESidebar';
import FileExplorer from '../components/ide/FileExplorer';
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
        openTab, closeTab, setActiveTab, updateTabContent, markTabSaved,
        renameTab, closeAllTabs,
        sidebarCollapsed, sidebarView, setSidebarView, toggleSidebar,
        addToRecentFiles,
    } = useIdeStore();

    const [files, setFiles] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [terminalOpen, setTerminalOpen] = useState(true);

    const effectiveProjectId = projectId || activeProjectId;

    const loadProject = useCallback(async (id: string) => {
        setIsLoadingProject(true);
        closeAllTabs(); // Clear stale tabs from previous project
        try {
            const { data } = await api.get(`/ide/projects/${id}`);
            setProject(data.project);
            setFiles(data.files || []);
            setActiveProject(id);

            // Restore last open file or auto-open first file
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

    // Track recently opened files
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

    const ensureProject = async (): Promise<string | null> => {
        if (effectiveProjectId) return effectiveProjectId;
        try {
            const { data } = await api.post('/ide/projects', { name: 'Untitled Project' });
            navigate(`/ide/${data.project._id}`);
            return data.project._id;
        } catch (err: any) {
            console.error('Failed to auto-create project', err);
            alert('Please create a project first before adding files.');
            return null;
        }
    };

    const handleCreateFile = async (name: string, content?: string) => {
        const pId = await ensureProject();
        if (!pId) return;
        try {
            const { data } = await api.post(`/ide/projects/${pId}/files`, { name, content });
            setFiles((prev) => {
                if (prev.some(f => f.name === data.file.name)) return prev;
                return [...prev, data.file];
            });
            openTab(data.file);
        } catch (err: any) {
            console.error('Create file failed', err?.response?.data?.error?.message || err.message);
            alert(err?.response?.data?.error?.message || err.message);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!effectiveProjectId) return;
        try {
            await api.delete(`/ide/projects/${effectiveProjectId}/files/${fileId}`);
            setFiles((prev) => prev.filter((f) => f._id !== fileId));
        } catch (err) {
            console.error('Delete file failed', err);
        }
    };

    const handleRenameFile = async (fileId: string, name: string) => {
        if (!effectiveProjectId) return;
        try {
            const { data } = await api.put(`/ide/projects/${effectiveProjectId}/files/${fileId}`, { name });
            setFiles((prev) => prev.map((f) => f._id === fileId ? data.file : f));
            renameTab(fileId, data.file.name, data.file.language);
        } catch (err) {
            console.error('Rename failed', err);
        }
    };

    const activeTab = openTabs.find((t) => t.fileId === activeTabId);
    const activeFile = files.find((f) => f._id === activeTabId);

    const handleViewChange = (view: 'projects' | 'history') => {
        if (sidebarView === view) {
            toggleSidebar();
        } else {
            setSidebarView(view);
            if (sidebarCollapsed) toggleSidebar();
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0f172a] text-white font-mono">
            <IDESidebar
                activeView={sidebarView}
                onViewChange={handleViewChange}
                onClose={() => navigate('/chat')}
            />

            <PanelGroup direction="horizontal">
                {!sidebarCollapsed && (
                    <>
                        <Panel defaultSize={15} minSize={10} maxSize={30} className="flex flex-col border-r border-[#1e293b]">
                            {sidebarView === 'projects' ? (
                                <div className="flex flex-col h-full bg-[#0f172a]">
                                    <div className="flex items-center justify-between px-4 py-2 bg-[#0d1425] border-b border-white/5">
                                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400 truncate mr-2">
                                            {project ? project.name : 'EXPLORER'}
                                        </span>
                                        <button
                                            onClick={toggleSidebar}
                                            className="p-1 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-95"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <FileExplorer
                                        files={files}
                                        activeFileId={activeTabId}
                                        onOpenFile={openTab}
                                        onCreateFile={handleCreateFile}
                                        onDeleteFile={handleDeleteFile}
                                        onRenameFile={handleRenameFile}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col h-full bg-[#0f172a]">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e293b]">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <History className="h-3 w-3" /> History
                                        </span>
                                        <button
                                            onClick={toggleSidebar}
                                            className="p-1 rounded hover:bg-[#1e293b] text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <HistoryPanel files={files} />
                                    </div>
                                </div>
                            )}
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-[#1e293b] hover:bg-indigo-500 transition-colors" />
                    </>
                )}

                <Panel defaultSize={60} minSize={30}>
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={75} minSize={20} className="flex flex-col min-w-0 overflow-hidden ide-bg mb-1 rounded-t-2xl border-t border-x ide-border">
                            <div className="flex items-center border-b ide-border bg-[#0a0f1e]/80 backdrop-blur-md overflow-x-auto min-h-[44px] shrink-0 custom-scrollbar">
                                {openTabs.length === 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 italic">
                                        No files active
                                    </div>
                                )}
                                {openTabs.map((tab) => (
                                    <button
                                        key={tab.fileId}
                                        onClick={() => setActiveTab(tab.fileId)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-5 py-2.5 text-[11px] font-bold border-r ide-border whitespace-nowrap transition-all group",
                                            tab.fileId === activeTabId
                                                ? "bg-[#0f172a] text-white border-t-2 border-t-indigo-500 shadow-[inset_0_1px_10px_rgba(99,102,241,0.05)]"
                                                : "bg-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                                        )}
                                    >
                                        {tab.isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />}
                                        {tab.name}
                                        <span
                                            onClick={(e) => { e.stopPropagation(); closeTab(tab.fileId); }}
                                            className="ml-2 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </span>
                                    </button>
                                ))}
                                <div className="flex-1" />

                                {/* Terminal Toggle */}
                                <button
                                    onClick={() => setTerminalOpen(!terminalOpen)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-l ide-border shrink-0 bg-transparent active:scale-95",
                                        terminalOpen ? "text-indigo-400 bg-indigo-500/5 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]" : "text-slate-500 hover:text-slate-300"
                                    )}
                                    title={terminalOpen ? "Hide Terminal" : "Show Terminal"}
                                >
                                    <TerminalIcon className="h-3.5 w-3.5" />
                                    Terminal
                                </button>

                                <button
                                    onClick={() => navigate('/chat')}
                                    className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all border-l ide-border shrink-0 bg-transparent active:scale-95"
                                    title="Close IDE"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Close IDE
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-hidden bg-[#0f172a]">
                                {isLoadingProject ? (
                                    <div className="flex h-full items-center justify-center bg-[#0f172a]">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
                                    </div>
                                ) : !effectiveProjectId ? (
                                    <NoProjectState />
                                ) : !activeTab ? (
                                    <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-[#0f172a] p-10 text-center">
                                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                                            <FileCode className="h-10 w-10 text-slate-700" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 mb-1">No file selected</p>
                                        <p className="text-xs text-slate-600">Select a file from the explorer or create a new one to start coding</p>
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
                                <Panel defaultSize={25} minSize={10} className="border-t border-[#1e293b] flex flex-col shrink-0">
                                    <div className="flex items-center px-3 py-1 bg-[#0a0f1e] border-b border-[#1e293b] shrink-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-1">Terminal</span>
                                        <button
                                            onClick={() => setTerminalOpen(false)}
                                            className="p-1 text-slate-400 hover:text-white"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-hidden bg-black/20">
                                        <Terminal activeFile={activeFile || null} />
                                    </div>
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#1e293b] hover:bg-indigo-500 transition-colors" />

                <Panel defaultSize={25} minSize={20} maxSize={40} className="border-l border-[#1e293b] bg-[#0f172a]">
                    <AIAssistantPanel
                        files={files}
                        activeFile={activeFile || null}
                        onCreateFile={handleCreateFile}
                    />
                </Panel>
            </PanelGroup >
        </div >
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
        <div className="flex h-full flex-col items-center justify-center p-6 mesh-gradient-premium">
            <div className="w-full max-w-2xl glass-premium rounded-3xl p-10 flex flex-col items-center shadow-2xl relative z-10">
                <div className="mb-8 relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative h-24 w-24 transition-transform duration-500 hover:scale-105">
                        <AILogo className="w-full h-full" />
                    </div>
                </div>

                <h2 className="mb-3 text-3xl font-extrabold text-white tracking-tight">Welcome to AI Byte IDE</h2>
                <p className="mb-10 text-base text-slate-300 max-w-md text-center">
                    The next-gen intelligent workspace. Create a project or pick up where you left off.
                </p>

                <div className="w-full max-w-lg space-y-8">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <input
                                    type="text"
                                    placeholder="Project name (e.g. main.py, dashboard.js)"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-3.5 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <Keyboard className="h-3.5 w-3.5 text-indigo-400" />
                                </div>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !newName.trim()}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Create
                            </button>
                        </div>
                        {error && <p className="text-xs text-red-400 px-2 text-center">{error}</p>}
                    </div>

                    {projects.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent Projects</h3>
                                <div className="h-px flex-1 mx-4 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {projects.slice(0, 4).map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => navigate(`/ide/${p._id}`)}
                                        className="group relative flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:bg-white/[0.07] hover:border-indigo-500/30 hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            {getLangIcon(p.language)}
                                            <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                        <div className="font-bold text-white text-sm truncate">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            {new Date(p.updatedAt).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
        </div>
    );
}

function HistoryPanel({ files }: { files: any[] }) {
    const { recentFiles, openTab, removeFromRecentFiles, openTabs, setActiveTab } = useIdeStore();

    if (recentFiles.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                    <History className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">No history yet</p>
                <p className="text-[10px] text-slate-700 mt-1">Files you open will appear here</p>
            </div>
        );
    }

    const handleOpen = (entry: any) => {
        const liveFile = files.find((f: any) => f._id === entry.id);
        if (liveFile) { openTab(liveFile); return; }
        const openTab_ = openTabs.find(t => t.fileId === entry.id);
        if (openTab_) { setActiveTab(entry.id); return; }
        if (entry.content !== undefined) {
            openTab({ _id: entry.id, name: entry.name, language: entry.language, content: entry.content, path: '', project: '' });
            return;
        }
        alert(`Content for "${entry.name}" is no longer available.`);
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            <div className="px-3 pb-2">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Recently Opened</p>
            </div>
            {recentFiles.map((entry) => {
                const liveFile = files.find((f: any) => f._id === entry.id);
                const isDeleted = !liveFile;
                const stillInTab = openTabs.some(t => t.fileId === entry.id);
                const canOpen = !!liveFile || stillInTab || entry.content !== undefined;

                return (
                    <div key={entry.id} className="relative group/hitem mx-1">
                        <button
                            onClick={() => handleOpen(entry)}
                            title={canOpen ? `Open ${entry.name}` : 'Content no longer available'}
                            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all group ${canOpen ? 'hover:bg-white/[0.04] cursor-pointer' : 'opacity-30 cursor-default'}`}
                        >
                            <FolderOpen className={`h-3.5 w-3.5 shrink-0 transition-colors ${canOpen ? 'text-slate-600 group-hover:text-indigo-400' : 'text-slate-700'}`} />
                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium truncate transition-colors ${canOpen ? 'text-slate-300 group-hover:text-white' : 'text-slate-700'}`}>
                                    {entry.name}
                                </div>
                                <div className="text-[9px] truncate uppercase tracking-wider mt-0.5 text-slate-600">
                                    {isDeleted ? (
                                        <span className="text-amber-600/80">deleted • view only</span>
                                    ) : entry.language}
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFromRecentFiles(entry.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-red-900 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title="Remove from history"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
