import { useState, useEffect, useCallback } from 'react';
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
  aiProvider?: 'ollama' | 'gemini';
  lastMessageAt?: string;
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
  const [defaultMode, setDefaultMode] = useState<'syllabus' | 'open'>('syllabus');

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
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchPdfs();
    fetchStats();
  }, [fetchSessions, fetchPdfs, fetchStats]);

  useEffect(() => {
    if (sessionId) fetchSession(sessionId);
    else setCurrentSession(null), setMessages([]);
  }, [sessionId, fetchSession]);

  const handleNewChat = () => {
    navigate('/chat', { replace: true });
    setCurrentSession(null);
    setMessages([]);
  };

  const handleSend = async (content: string, aiProvider?: 'ollama' | 'gemini') => {
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      if (!aiProvider) return;
      setIsLoading(true);
      try {
        const { data } = await api.post('/chat/sessions', {
          title: 'New Chat',
          mode: defaultMode,
          aiProvider,
        });
        setSessions((prev) => [data.session, ...prev]);
        activeSessionId = data.session._id;
        navigate(`/chat/${activeSessionId}`);
        const userMsg: Message = {
          _id: `temp-${Date.now()}`,
          role: 'user',
          content,
        };
        setMessages([userMsg]);
        const msgRes = await api.post(`/chat/sessions/${activeSessionId}/messages`, { content });
        setMessages((prev) =>
          prev.filter((m) => m._id !== userMsg._id).concat(msgRes.data.userMessage, msgRes.data.aiMessage)
        );
        fetchStats();
      } catch (err) {
        setMessages([]);
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
      setMessages((prev) =>
        prev.filter((m) => m._id !== userMsg._id).concat(data.userMessage, data.aiMessage)
      );
      fetchStats();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== userMsg._id));
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <LeftSidebar
        sessions={sessions}
        onNewChat={handleNewChat}
        onUploadClick={() => setIsUploadOpen((v) => !v)}
        onDeleteSession={handleDeleteSession}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          mode={currentSession?.mode ?? defaultMode}
          onModeChange={sessionId ? handleModeChange : (m) => setDefaultMode(m)}
        />
        <ChatPanel
          sessionId={sessionId || null}
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          mode={currentSession?.mode || 'syllabus'}
          aiProvider={currentSession?.aiProvider || 'ollama'}
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
