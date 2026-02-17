import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import ChatPanel from '../components/chat/ChatPanel';
import PDFUploadModal from '../components/chat/PDFUploadModal';
import api from '../lib/api';

interface Session {
  _id: string;
  title: string;
  mode: 'syllabus' | 'open';
  lastMessageAt?: string;
  pdfId?: string | { _id: string; originalName: string } | null;
}

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface PDF {
  _id: string;
  originalName: string;
}

export default function Dashboard() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [streak, setStreak] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<{ date: string; doubtsSolved: number; studyTimeMinutes: number }[]>([]);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [defaultMode, setDefaultMode] = useState<'syllabus' | 'open'>('syllabus');
  const justCreatedSessionIdRef = useRef<string | null>(null);

  const normalizeMessage = (m: { _id?: string; id?: string; role: string; content?: string }): Message => ({
    _id: (m._id ?? m.id ?? `msg-${Date.now()}`).toString(),
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m.content === 'string' ? m.content : '',
  });

  const fetchSessions = useCallback(async () => {
    const { data } = await api.get('/chat/sessions');
    setSessions(data.sessions || []);
  }, []);

  const fetchSession = useCallback(async (id: string) => {
    const { data } = await api.get(`/chat/sessions/${id}`);
    setCurrentSession(data.session);
    setMessages(data.messages || []);
  }, []);

  const fetchPdfs = useCallback(async () => {
    const { data } = await api.get('/pdf');
    setPdfs(data.pdfs || []);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [s, st, t, tp] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/streaks'),
        api.get('/stats/timeline?range=week'),
        api.get('/stats/topics'),
      ]);
      setSummary(s.data.summary || null);
      setStreak(st.data.streak || null);
      setTimeline(t.data.timeline || []);
      setTopics(tp.data.topics || []);
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchPdfs();
    fetchStats();
  }, [fetchSessions, fetchPdfs, fetchStats]);

  useEffect(() => {
    if (sessionId === justCreatedSessionIdRef.current) {
      justCreatedSessionIdRef.current = null;
      return;
    }
    if (sessionId) fetchSession(sessionId);
    else setCurrentSession(null), setMessages([]);
  }, [sessionId, fetchSession]);

  const handleNewChat = () => {
    navigate('/chat');
    setCurrentSession(null);
    setMessages([]);
  };

  const handleSend = async (content: string) => {
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      setIsLoading(true);
      setChatError(null);
      try {
        const { data } = await api.post('/chat/sessions', {
          title: 'New Chat',
          mode: defaultMode,
        });
        const newId = data?.session?._id;
        if (!newId) throw new Error('No session ID returned');
        const msgRes = await api.post(`/chat/sessions/${newId}/messages`, { content });
        const userMsgRes = normalizeMessage(msgRes.data?.userMessage ?? { role: 'user', content });
        const aiMsgRes = normalizeMessage(msgRes.data?.aiMessage ?? { role: 'assistant', content: '' });
        setSessions((prev) => [data.session, ...prev]);
        setCurrentSession(data.session);
        setMessages([userMsgRes, aiMsgRes]);
        justCreatedSessionIdRef.current = newId;
        navigate(`/chat/${newId}`);
        setChatError(null);
        fetchStats();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
        setChatError(msg || 'AI is unavailable. Is Ollama running? Check RUN.md.');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    const userMsg: Message = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const { data } = await api.post(`/chat/sessions/${activeSessionId}/messages`, { content });
      const userMsgRes = normalizeMessage(data?.userMessage ?? { role: 'user', content });
      const aiMsgRes = normalizeMessage(data?.aiMessage ?? { role: 'assistant', content: '' });
      setMessages((prev) =>
        prev.filter((m) => m._id !== userMsg._id).concat(userMsgRes, aiMsgRes)
      );
      setChatError(null);
      fetchStats();
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m._id !== userMsg._id));
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setChatError(msg || 'AI is unavailable. Is Ollama running? Check RUN.md.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (currentSession?._id === id) {
        setCurrentSession(null);
        setMessages([]);
        navigate('/chat', { replace: true });
      }
    } catch (_) {
      // ignore
    }
  };

  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    await api.post('/pdf/upload', form);
    fetchPdfs();
  };

  const handleModeChange = async (mode: 'syllabus' | 'open') => {
    if (!sessionId || !currentSession) return;
    try {
      const { data } = await api.patch(`/chat/sessions/${sessionId}`, { mode });
      setCurrentSession(data.session);
    } catch (_) {
      // ignore
    }
  };

  const handleAttachPdf = async (pdfId: string) => {
    if (!sessionId) return;
    try {
      const { data } = await api.patch(`/chat/sessions/${sessionId}`, { pdfId });
      setCurrentSession(data.session);
    } catch (_) {
      // ignore
    }
  };

  const handleDetachPdf = async () => {
    if (!sessionId) return;
    try {
      const { data } = await api.patch(`/chat/sessions/${sessionId}`, { pdfId: null });
      setCurrentSession(data.session);
    } catch (_) {
      // ignore
    }
  };

  const handleDeletePdf = async (pdfId: string) => {
    try {
      await api.delete(`/pdf/${pdfId}`);
      fetchPdfs();
      if (currentSession?.pdfId && (typeof currentSession.pdfId === 'string' ? currentSession.pdfId : currentSession.pdfId._id) === pdfId) {
        await handleDetachPdf();
      }
    } catch (_) {
      // ignore
    }
  };

  const attachedPdfId = currentSession?.pdfId
    ? typeof currentSession.pdfId === 'object' && currentSession.pdfId !== null
      ? (currentSession.pdfId as { _id: string })._id
      : (currentSession.pdfId as string)
    : null;
  const attachedPdfName = currentSession?.pdfId && typeof currentSession.pdfId === 'object'
    ? (currentSession.pdfId as { originalName: string }).originalName
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <LeftSidebar
        sessions={sessions}
        pdfs={pdfs}
        attachedPdfId={attachedPdfId}
        attachedPdfName={attachedPdfName}
        onNewChat={handleNewChat}
        onUploadClick={() => setIsUploadOpen((v) => !v)}
        onDeleteSession={handleDeleteSession}
        onAttachPdf={handleAttachPdf}
        onDetachPdf={handleDetachPdf}
        onDeletePdf={handleDeletePdf}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          mode={currentSession?.mode ?? defaultMode}
          onModeChange={sessionId ? handleModeChange : (m) => setDefaultMode(m)}
        />
        <ChatPanel
          sessionId={sessionId || null}
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          error={chatError}
          onDismissError={() => setChatError(null)}
          mode={currentSession?.mode || 'syllabus'}
          pdfs={pdfs}
          attachedPdfId={attachedPdfId}
          onClearPdf={handleDetachPdf}
        />
      </main>
      <RightSidebar
        summary={summary as Parameters<typeof RightSidebar>[0]['summary']}
        streak={streak as Parameters<typeof RightSidebar>[0]['streak']}
        timeline={timeline}
        topics={topics}
      />
      <PDFUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
        pdfs={pdfs}
      />
    </div>
  );
}
