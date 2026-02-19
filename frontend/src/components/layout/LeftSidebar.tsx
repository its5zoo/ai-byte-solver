import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Upload,
  Trash2,
  FileText,
  Link as LinkIcon,
  Check,
  Link2,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';

interface SessionWithDate {
  _id: string;
  title: string;
  lastMessageAt?: string;
}

interface PDFItem {
  _id: string;
  originalName: string;
}

interface LeftSidebarProps {
  sessions: SessionWithDate[];
  pdfs: PDFItem[];
  attachedPdfId: string | null;
  attachedPdfName: string | null;
  onNewChat: () => void;
  onUploadClick: () => void;
  onDeleteSession: (id: string) => void;
  onAttachPdf: (pdfId: string) => void;
  onDetachPdf: () => void;
  onDeletePdf: (pdfId: string) => void;
}

function groupSessionsByDate(sessions: SessionWithDate[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayIds: string[] = [];
  const yesterdayIds: string[] = [];
  const older: SessionWithDate[] = [];

  sessions.forEach((s) => {
    const d = s.lastMessageAt ? new Date(s.lastMessageAt) : new Date();
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) todayIds.push(s._id);
    else if (d.getTime() === yesterday.getTime()) yesterdayIds.push(s._id);
    else older.push(s);
  });

  return {
    today: sessions.filter((s) => todayIds.includes(s._id)),
    yesterday: sessions.filter((s) => yesterdayIds.includes(s._id)),
    older: older,
  };
}

export default function LeftSidebar({
  sessions,
  pdfs,
  attachedPdfId,
  attachedPdfName,
  onNewChat,
  onUploadClick,
  onDeleteSession,
  onAttachPdf,
  onDetachPdf,
  onDeletePdf,
}: LeftSidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const grouped = groupSessionsByDate(sessions);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteSession(sessionId);
    if (location.pathname === `/chat/${sessionId}`) navigate('/chat', { replace: true });
  };

  const handleShare = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/chat/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderList = (list: SessionWithDate[]) =>
    list.map((s) => (
      <Link
        key={s._id}
        to={`/chat/${s._id}`}
        className={cn(
          'group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
          location.pathname === `/chat/${s._id}`
            ? 'bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))]'
            : 'text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate">{s.title || 'New Chat'}</span>

        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 ml-auto">
          <button
            type="button"
            onClick={(e) => handleShare(e, s._id)}
            className="shrink-0 rounded p-1 text-[hsl(var(--foreground-tertiary))] hover:bg-[hsl(var(--primary-light))] hover:text-[hsl(var(--primary))] mr-0.5"
            aria-label="Copy link"
            title="Copy link"
          >
            {copiedId === s._id ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={(e) => handleDelete(e, s._id)}
            className="shrink-0 rounded p-1 text-[hsl(var(--foreground-tertiary))] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40"
            aria-label="Delete chat"
            title="Delete chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </Link>
    ));

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="glass flex h-full w-64 flex-col border-r transition-all">
      <div className="flex h-14 shrink-0 items-center px-4 border-b border-[hsl(var(--glass-border))]">
        <Logo showText />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 custom-scrollbar">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700"
        >
          <Plus className="h-5 w-5" />
          New Chat
        </button>

        <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.5)] p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span
              className="font-black text-white uppercase tracking-tighter"
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
            >
              Upload PDF
            </span>
          </div>
          <p className="mb-3 text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest opacity-80">knowledge base & syllabus</p>
          <button
            type="button"
            onClick={onUploadClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          >
            <Upload className="h-4 w-4" />
            Browse Files
          </button>
        </div>

        {attachedPdfName && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-2 dark:border-violet-800 dark:bg-violet-900/30 animate-fade-in-down">
            <p className="mb-1.5 px-1 text-xs font-medium text-violet-700 dark:text-violet-300">Active Context</p>
            <div className="flex items-center justify-between gap-1 rounded-lg bg-white px-2 py-1.5 dark:bg-slate-800 shadow-sm">
              <span className="min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={attachedPdfName}>
                {attachedPdfName}
              </span>
              <button
                type="button"
                onClick={onDetachPdf}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                aria-label="Detach PDF"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="rounded-xl border border-slate-200/50 bg-white/40 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
              Library
            </p>
            <ul className="space-y-1">
              {pdfs.map((pdf) => (
                <li
                  key={pdf._id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm group',
                    attachedPdfId === pdf._id ? 'bg-violet-100 dark:bg-violet-900/40' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
                  <span className="min-w-0 flex-1 truncate text-[hsl(var(--foreground-secondary))] font-medium" title={pdf.originalName}>
                    {pdf.originalName}
                  </span>
                  <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onAttachPdf(pdf._id)}
                      className={cn(
                        'rounded p-1',
                        attachedPdfId === pdf._id
                          ? 'bg-violet-500 text-white'
                          : 'text-slate-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/50 dark:hover:text-violet-400'
                      )}
                      title={attachedPdfId === pdf._id ? 'Active Context' : 'Link this PDF'}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePdf(pdf._id)}
                      className="rounded p-1 text-[hsl(var(--foreground-tertiary))] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40"
                      title="Delete PDF"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="min-h-0 flex-1">
          <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
            History
          </p>
          {grouped.today.length > 0 && (
            <>
              <p className="mb-1 px-2 text-xs text-slate-500 dark:text-slate-400">Today</p>
              <div className="space-y-0.5">{renderList(grouped.today)}</div>
            </>
          )}
          {grouped.yesterday.length > 0 && (
            <>
              <p className="mb-1 mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">Yesterday</p>
              <div className="space-y-0.5">{renderList(grouped.yesterday)}</div>
            </>
          )}
          {grouped.older.length > 0 && (
            <>
              <p className="mb-1 mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">Older</p>
              <div className="space-y-0.5">{renderList(grouped.older)}</div>
            </>
          )}
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 italic">No chats yet</p>
          )}
        </div>
      </div>

      <Link
        to="/profile"
        className="border-t border-slate-200 p-3 dark:border-slate-800"
      >
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-700 text-sm font-semibold text-white shadow-lg shadow-violet-500/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-black text-white"
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
            >
              {user?.name || 'User'}
            </p>
            <p
              className="truncate text-[10px] font-black text-white/90 uppercase tracking-wider"
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
            >
              {user?.email || ''}
            </p>
          </div>
        </div>
      </Link>
    </aside >
  );
}
