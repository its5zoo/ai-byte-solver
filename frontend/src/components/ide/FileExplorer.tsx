import { useState, useRef, useCallback } from 'react';
import {
    File, Plus, Trash2, Edit2,
    FileCode, FileText, FileCog, FileJson, FileType
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileItem {
    _id: string;
    name: string;
    path: string;
    language: string;
    content: string;
    project?: string;
}

interface FileExplorerProps {
    files: FileItem[];
    activeFileId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onOpenFile: (file: any) => void;
    onCreateFile: (name: string) => void;
    onDeleteFile: (fileId: string) => void;
    onRenameFile: (fileId: string, name: string) => void;
}

function getFileIcon(language: string, name: string) {
    const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
    if (language === 'typescript' || ['ts', 'tsx'].includes(ext!))
        return <span className="text-[9px] font-black text-blue-400 w-5 h-5 rounded bg-blue-400/10 flex items-center justify-center shrink-0">TS</span>;
    if (['javascript'].includes(language) || ['js', 'jsx', 'mjs'].includes(ext!))
        return <span className="text-[9px] font-black text-yellow-400 w-5 h-5 rounded bg-yellow-400/10 flex items-center justify-center shrink-0">JS</span>;
    if (language === 'python' || ext === 'py')
        return <span className="text-[9px] font-black text-green-400 w-5 h-5 rounded bg-green-400/10 flex items-center justify-center shrink-0">PY</span>;
    if (language === 'cpp' || ['cpp', 'cc', 'cxx'].includes(ext!))
        return <span className="text-[9px] font-black text-purple-400 w-5 h-5 rounded bg-purple-400/10 flex items-center justify-center shrink-0">C+</span>;
    if (language === 'c' || ext === 'c')
        return <span className="text-[9px] font-black text-purple-300 w-5 h-5 rounded bg-purple-300/10 flex items-center justify-center shrink-0">C</span>;
    if (language === 'java' || ext === 'java')
        return <span className="text-[9px] font-black text-orange-400 w-5 h-5 rounded bg-orange-400/10 flex items-center justify-center shrink-0">JA</span>;
    if (language === 'csharp' || ext === 'cs')
        return <span className="text-[9px] font-black text-green-400 w-5 h-5 rounded bg-green-400/10 flex items-center justify-center shrink-0">C#</span>;
    if (language === 'rust' || ext === 'rs')
        return <span className="text-[9px] font-black text-orange-500 w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0">RS</span>;
    if (language === 'go' || ext === 'go')
        return <span className="text-[9px] font-black text-cyan-400 w-5 h-5 rounded bg-cyan-400/10 flex items-center justify-center shrink-0">GO</span>;
    if (language === 'ruby' || ext === 'rb')
        return <span className="text-[9px] font-black text-red-400 w-5 h-5 rounded bg-red-400/10 flex items-center justify-center shrink-0">RB</span>;
    if (language === 'php' || ext === 'php')
        return <span className="text-[9px] font-black text-indigo-400 w-5 h-5 rounded bg-indigo-400/10 flex items-center justify-center shrink-0">PH</span>;
    if (language === 'html' || ['html', 'htm'].includes(ext!))
        return <FileCode className="h-4 w-4 text-orange-400 shrink-0" />;
    if (['css', 'scss'].includes(language) || ['css', 'scss'].includes(ext!))
        return <FileCog className="h-4 w-4 text-pink-400 shrink-0" />;
    if (language === 'json' || ext === 'json')
        return <FileJson className="h-4 w-4 text-yellow-300 shrink-0" />;
    if (language === 'markdown' || ['md', 'mdx'].includes(ext!))
        return <FileType className="h-4 w-4 text-slate-300 shrink-0" />;
    if (['shell', 'bash'].includes(language) || ['sh', 'bash', 'zsh'].includes(ext!))
        return <FileText className="h-4 w-4 text-green-400 shrink-0" />;
    return <File className="h-4 w-4 text-slate-500 shrink-0" />;
}

type ContextMenuState = { x: number; y: number; fileId: string } | null;

export default function FileExplorer({
    files,
    activeFileId,
    onOpenFile,
    onCreateFile,
    onDeleteFile,
    onRenameFile,
}: FileExplorerProps) {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);
    const createInputRef = useRef<HTMLInputElement>(null);

    const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    };

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const startRename = useCallback((file: FileItem) => {
        setRenamingId(file._id);
        setRenameValue(file.name);
        closeContextMenu();
        setTimeout(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }, 50);
    }, [closeContextMenu]);

    const commitRename = useCallback(() => {
        if (renamingId && renameValue.trim()) {
            onRenameFile(renamingId, renameValue.trim());
        }
        setRenamingId(null);
    }, [renamingId, renameValue, onRenameFile]);

    const startCreate = () => {
        setIsCreating(true);
        setNewFileName('');
        setTimeout(() => createInputRef.current?.focus(), 50);
    };

    const commitCreate = async () => {
        const name = newFileName.trim();
        if (name) {
            try {
                await onCreateFile(name);
                setIsCreating(false);
                setNewFileName('');
            } catch (err) {
                // Keep creating open so user can try again or fix name
            }
        } else {
            setIsCreating(false);
            setNewFileName('');
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0f1e]" onClick={closeContextMenu}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">FILES</span>
                <button
                    onClick={startCreate}
                    title="New File"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 transition-all active:scale-95"
                >
                    <Plus className="h-3 w-3" />
                    New
                </button>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {/* New file input */}
                {isCreating && (
                    <div className="flex items-center gap-2 px-3 py-2 mx-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20 mb-1">
                        <File className="h-4 w-4 text-indigo-400 shrink-0" />
                        <input
                            ref={createInputRef}
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onBlur={commitCreate}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitCreate();
                                if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
                            }}
                            className="flex-1 bg-transparent text-xs text-white outline-none placeholder-indigo-300/40"
                            placeholder="filename.py"
                        />
                    </div>
                )}

                {files.length === 0 && !isCreating && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center opacity-40">
                        <File className="h-8 w-8 mb-2 text-slate-500" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">No files yet</p>
                        <p className="text-[9px] text-slate-600 mt-1">Click + New to create one</p>
                    </div>
                )}

                {files.map((file) => (
                    <div
                        key={file._id}
                        onContextMenu={(e) => handleContextMenu(e, file._id)}
                        onClick={() => renamingId !== file._id && onOpenFile(file)}
                        className={cn(
                            'group relative flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-all select-none mx-1 rounded-lg',
                            activeFileId === file._id
                                ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                                : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'
                        )}
                    >
                        {/* Active indicator */}
                        {activeFileId === file._id && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
                        )}

                        {getFileIcon(file.language, file.name)}

                        {renamingId === file._id ? (
                            <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitRename();
                                    if (e.key === 'Escape') setRenamingId(null);
                                }}
                                className="flex-1 min-w-0 rounded bg-[#1e293b] px-1 text-xs text-white outline-none ring-1 ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="flex-1 min-w-0 truncate font-medium">{file.name}</span>
                        )}

                        {/* Action buttons — always visible */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); startRename(file); }}
                                className="p-1 rounded text-slate-700 hover:text-slate-300 hover:bg-white/5 transition-all"
                                title="Rename"
                            >
                                <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteFile(file._id); }}
                                className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Context menu */}
            {contextMenu && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
                    className="rounded-xl border border-white/10 bg-[#0d1425] shadow-2xl backdrop-blur-xl py-1.5 min-w-[150px]"
                >
                    <button
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => {
                            const file = files.find((f) => f._id === contextMenu.fileId);
                            if (file) startRename(file);
                        }}
                    >
                        <Edit2 className="h-3 w-3 text-indigo-400" /> Rename
                    </button>
                    <button
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                        onClick={() => { onDeleteFile(contextMenu.fileId); closeContextMenu(); }}
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}
