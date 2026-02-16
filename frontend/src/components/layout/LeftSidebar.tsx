import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  Plus,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface SessionWithDate {
  _id: string;
  title: string;
  lastMessageAt?: string;
}

interface LeftSidebarProps {
  sessions: SessionWithDate[];
  onNewChat: () => void;
  onUploadClick: () => void;
  onDeleteSession: (id: string) => void;
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
  onNewChat,
  onUploadClick,
  onDeleteSession,
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
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Brain className="h-4 w-4" />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">AI Byte Solver</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white shadow-md transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          New Chat
        </button>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Upload PDF</span>
          </div>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Drop PDF or browse</p>
          <button
            type="button"
            onClick={onUploadClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Upload className="h-4 w-4" />
            Browse
          </button>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Max 25 MB</p>
        </div>

        <div className="min-h-0 flex-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            History
          </p>
          {grouped.today.length > 0 && (
            <>
              <p className="mb-1 px-2 text-xs text-gray-500 dark:text-gray-400">Today</p>
              <div className="space-y-0.5">{renderList(grouped.today)}</div>
            </>
          )}
          {grouped.yesterday.length > 0 && (
            <>
              <p className="mb-1 mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">Yesterday</p>
              <div className="space-y-0.5">{renderList(grouped.yesterday)}</div>
            </>
          )}
          {grouped.older.length > 0 && (
            <>
              <p className="mb-1 mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">Older</p>
              <div className="space-y-0.5">{renderList(grouped.older)}</div>
            </>
          )}
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">No chats yet</p>
          )}
        </div>
      </div>

      <Link
        to="/profile"
        className="border-t border-gray-200 p-3 dark:border-gray-800"
      >
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
          </div>
        </div>
      </Link>
    </aside>
  );
}
