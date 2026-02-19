import { useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIdeStore } from '../../stores/ideStore';

interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNumber?: number;
}

interface DiffViewerProps {
    patch: string | null;
    onApply: () => void;
    isApplying: boolean;
}

function computeDiff(original: string = '', updated: string = ''): DiffLine[] {
    const originalLines = (original || '').split('\n');
    const updatedLines = (updated || '').split('\n');
    const result: DiffLine[] = [];

    const maxLen = Math.max(originalLines.length, updatedLines.length);

    for (let i = 0; i < maxLen; i++) {
        const origLine = originalLines[i];
        const newLine = updatedLines[i];

        if (origLine === undefined) {
            result.push({ type: 'add', content: newLine, lineNumber: i + 1 });
        } else if (newLine === undefined) {
            result.push({ type: 'remove', content: origLine, lineNumber: i + 1 });
        } else if (origLine !== newLine) {
            result.push({ type: 'remove', content: origLine, lineNumber: i + 1 });
            result.push({ type: 'add', content: newLine, lineNumber: i + 1 });
        } else {
            result.push({ type: 'context', content: origLine, lineNumber: i + 1 });
        }
    }

    const collapsed: DiffLine[] = [];
    let contextRun = 0;
    for (const line of result) {
        if (line.type === 'context') {
            contextRun++;
            if (contextRun <= 2) collapsed.push(line);
            else if (contextRun === 3) collapsed.push({ type: 'context', content: '...', lineNumber: line.lineNumber });
        } else {
            contextRun = 0;
            collapsed.push(line);
        }
    }
    return collapsed;
}

export default function DiffViewer({ patch, onApply, isApplying }: DiffViewerProps) {
    const { activeTabId, openTabs } = useIdeStore();
    const [accepted, setAccepted] = useState<boolean | null>(null);

    const activeTab = openTabs.find((t) => t.fileId === activeTabId);
    const originalCode = activeTab?.content || '';
    const newCode = patch || '';

    const diffLines = computeDiff(originalCode, newCode);

    const handleAccept = useCallback(() => {
        setAccepted(true);
        onApply();
    }, [onApply]);

    const handleReject = useCallback(() => {
        setAccepted(false);
    }, []);

    if (accepted === true) {
        return (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Check className="h-3 w-3" />
                Patch Applied
            </div>
        );
    }
    if (accepted === false) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <X className="h-3 w-3" />
                Patch Rejected
            </div>
        );
    }

    const addCount = diffLines.filter((l) => l.type === 'add').length;
    const removeCount = diffLines.filter((l) => l.type === 'remove').length;

    return (
        <div className="flex flex-col rounded-xl border border-white/10 bg-black/40 overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Proposed Changes</span>
                    <span className="text-green-400">+{addCount}</span>
                    <span className="text-red-400">-{removeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReject}
                        className="rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:bg-white/5 hover:text-white transition-all"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isApplying}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Apply
                    </button>
                </div>
            </div>

            {/* Diff lines */}
            <div className="overflow-x-auto overflow-y-auto max-h-48 font-mono text-[10px] bg-black/20">
                {diffLines.map((line, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'flex items-start gap-2 px-3 py-1 whitespace-pre leading-relaxed',
                            line.type === 'add' && 'bg-green-500/5 text-green-400 border-l-2 border-green-500',
                            line.type === 'remove' && 'bg-red-500/5 text-red-400 border-l-2 border-red-500',
                            line.type === 'context' && 'text-slate-500'
                        )}
                    >
                        <span className="shrink-0 w-3 text-right opacity-30 select-none font-bold">
                            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                        </span>
                        <span className="select-all opacity-90">{line.content}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

