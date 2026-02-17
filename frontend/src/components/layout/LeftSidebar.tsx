import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  Plus,
  Upload,
  Trash2,
  FileText,
  Paperclip,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

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
  sessionId: string | null;
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
  sessionId,
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

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteSession(sessionId);
    if (location.pathname === `/chat/${sessionId}`) navigate('/chat', { replace: true });
  };

  const renderList = (list: SessionWithDate[]) =>
    list.map((s) => (
      <Link
        key={s._id}
        to={`/chat/${s._id}`}
        className={cn(
          'group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
          location.pathname === `/chat/${s._id}`
            ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate">{s.title || 'New Chat'}</span>
        <button
          type="button"
          onClick={(e) => handleDelete(e, s._id)}
          className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label="Delete chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Link>
    ));

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md">
          <Brain className="h-4 w-4" />
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">AI Byte Solver</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700"
        >
          <Plus className="h-5 w-5" />
          New Chat
        </button>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">Upload PDF</span>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Drop PDF or browse</p>
          <button
            type="button"
            onClick={onUploadClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-800 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Upload className="h-4 w-4" />
            Browse
          </button>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Max 25 MB</p>
        </div>

        {attachedPdfName && sessionId && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-2 dark:border-violet-800 dark:bg-violet-900/30">
            <p className="mb-1.5 px-1 text-xs font-medium text-violet-700 dark:text-violet-300">Attached to this chat</p>
            <div className="flex items-center justify-between gap-1 rounded-lg bg-white px-2 py-1.5 dark:bg-slate-800">
              <span className="min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={attachedPdfName}>
                {attachedPdfName}
              </span>
              <button
                type="button"
                onClick={onDetachPdf}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                aria-label="Detach PDF"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your PDFs
            </p>
            <ul className="space-y-1">
              {pdfs.map((pdf) => (
                <li
                  key={pdf._id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                    attachedPdfId === pdf._id ? 'bg-violet-100 dark:bg-violet-900/40' : ''
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300" title={pdf.originalName}>
                    {pdf.originalName}
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    {sessionId && (
                      <button
                        type="button"
                        onClick={() => onAttachPdf(pdf._id)}
                        className={cn(
                          'rounded p-1',
                          attachedPdfId === pdf._id
                            ? 'bg-violet-500 text-white'
                            : 'text-slate-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/50 dark:hover:text-violet-400'
                        )}
                        title={attachedPdfId === pdf._id ? 'In use' : 'Use in this chat'}
                        aria-label={attachedPdfId === pdf._id ? 'In use' : 'Use in this chat'}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeletePdf(pdf._id)}
                      className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      aria-label="Delete PDF"
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
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">No chats yet</p>
          )}
        </div>
      </div>

      <Link
        to="/profile"
        className="border-t border-slate-200 p-3 dark:border-slate-800"
      >
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
          </div>
        </div>
      </Link>
    </aside>
  );
}
