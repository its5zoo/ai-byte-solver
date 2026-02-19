import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IdeTab {
    fileId: string;
    name: string;
    language: string;
    content: string;
    isUnsaved: boolean;
}

export interface IdeProject {
    _id: string;
    name: string;
    description: string;
    language: string;
    updatedAt: string;
}

export interface IdeFile {
    _id: string;
    project: string;
    name: string;
    path: string;
    content: string;
    language: string;
}

// Stores file metadata so history survives deletion
export interface RecentFileEntry {
    id: string;
    name: string;
    language: string;
    content?: string; // last known content snapshot for recovery
}

export type AiMode = 'chat' | 'fix' | 'explain' | 'optimize' | 'feature';
export type AiModel = 'gpt-oss:120b-cloud' | 'DeepSeek-v3.1:671b-cloud';

interface IdeState {
    // Projects
    activeProjectId: string | null;
    projects: IdeProject[];

    // Tabs / open files
    openTabs: IdeTab[];
    activeTabId: string | null;

    // AI
    selectedModel: AiModel;
    aiMode: AiMode;
    aiResponse: {
        explanation: string;
        codePatch: string | null;
        changedLines: unknown[];
        errorFix: string | null;
        suggestedFiles: unknown[];
    } | null;
    isAiLoading: boolean;

    // Terminal
    terminalOutput: string;

    // Sidebar
    sidebarCollapsed: boolean;
    sidebarView: 'projects' | 'history';

    recentFiles: RecentFileEntry[]; // List of recent files with metadata

    // Actions
    setActiveProject: (id: string | null) => void;
    setProjects: (projects: IdeProject[]) => void;
    openTab: (file: IdeFile) => void;
    closeTab: (fileId: string) => void;
    setActiveTab: (fileId: string) => void;
    updateTabContent: (fileId: string, content: string) => void;
    markTabSaved: (fileId: string) => void;
    /** Update name and language of an already-open tab after rename */
    renameTab: (fileId: string, name: string, language: string) => void;
    /** Close all tabs (e.g. when switching projects) */
    closeAllTabs: () => void;
    appendTerminalOutput: (text: string) => void;
    clearTerminalOutput: () => void;
    setAiResponse: (r: IdeState['aiResponse']) => void;
    setIsAiLoading: (v: boolean) => void;
    setSelectedModel: (m: AiModel) => void;
    setAiMode: (m: AiMode) => void;
    toggleSidebar: () => void;
    setSidebarView: (v: IdeState['sidebarView']) => void;
    setRecentFiles: (files: RecentFileEntry[]) => void;
    addToRecentFiles: (file: IdeFile) => void;
    removeFromRecentFiles: (fileId: string) => void;
}

export const useIdeStore = create<IdeState>()(
    persist(
        (set) => ({
            activeProjectId: null,
            projects: [],
            openTabs: [],
            activeTabId: null,
            selectedModel: 'gpt-oss:120b-cloud',
            aiMode: 'chat',
            aiResponse: null,
            isAiLoading: false,
            terminalOutput: '',
            sidebarCollapsed: false,
            sidebarView: 'projects',
            recentFiles: [] as RecentFileEntry[],

            setActiveProject: (id) => set({ activeProjectId: id }),
            setProjects: (projects) => set({ projects }),

            openTab: (file) =>
                set((state) => {
                    const existingIdx = state.openTabs.findIndex((t) => t.fileId === file._id);
                    if (existingIdx !== -1) {
                        // Refresh the content from the server version (in case it changed)
                        const updated = state.openTabs.map((t, i) =>
                            i === existingIdx
                                ? { ...t, name: file.name, language: file.language, content: file.content }
                                : t
                        );
                        return { openTabs: updated, activeTabId: file._id };
                    }
                    const newTab: IdeTab = {
                        fileId: file._id,
                        name: file.name,
                        language: file.language,
                        content: file.content,
                        isUnsaved: false,
                    };
                    return { openTabs: [...state.openTabs, newTab], activeTabId: file._id };
                }),

            closeTab: (fileId) =>
                set((state) => {
                    const filtered = state.openTabs.filter((t) => t.fileId !== fileId);
                    const newActive = state.activeTabId === fileId
                        ? (filtered[filtered.length - 1]?.fileId ?? null)
                        : state.activeTabId;
                    return { openTabs: filtered, activeTabId: newActive };
                }),

            setActiveTab: (fileId) => set({ activeTabId: fileId }),

            updateTabContent: (fileId, content) =>
                set((state) => ({
                    openTabs: state.openTabs.map((t) =>
                        t.fileId === fileId ? { ...t, content, isUnsaved: true } : t
                    ),
                })),

            markTabSaved: (fileId) =>
                set((state) => ({
                    openTabs: state.openTabs.map((t) =>
                        t.fileId === fileId ? { ...t, isUnsaved: false } : t
                    ),
                })),

            renameTab: (fileId, name, language) =>
                set((state) => ({
                    openTabs: state.openTabs.map((t) =>
                        t.fileId === fileId ? { ...t, name, language } : t
                    ),
                })),

            closeAllTabs: () => set({ openTabs: [], activeTabId: null, recentFiles: [] }),
            appendTerminalOutput: (text) =>
                set((state) => ({ terminalOutput: state.terminalOutput + text })),
            clearTerminalOutput: () => set({ terminalOutput: '' }),
            setAiResponse: (r) => set({ aiResponse: r }),
            setIsAiLoading: (v) => set({ isAiLoading: v }),
            setSelectedModel: (m) => set({ selectedModel: m }),
            setAiMode: (m) => set({ aiMode: m }),
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setSidebarView: (v) => set({ sidebarView: v }),
            setRecentFiles: (files) => set({ recentFiles: files }),
            addToRecentFiles: (file) =>
                set((state) => {
                    const filtered = state.recentFiles.filter((r) => r.id !== file._id);
                    return {
                        recentFiles: [
                            { id: file._id, name: file.name, language: file.language, content: file.content },
                            ...filtered,
                        ].slice(0, 20),
                    };
                }),
            removeFromRecentFiles: (fileId) =>
                set((state) => ({
                    recentFiles: state.recentFiles.filter((r) => r.id !== fileId),
                })),
        }),
        {
            name: 'ide-state',
            partialize: (s) => ({
                selectedModel: s.selectedModel,
                sidebarCollapsed: s.sidebarCollapsed,
                // Don't persist tabs/project across sessions to avoid stale data
            }),
        }
    )
);
