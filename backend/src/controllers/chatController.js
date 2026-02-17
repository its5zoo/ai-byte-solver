import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import LearningStatistics from '../models/LearningStatistics.js';
import { getAIResponse, getAIResponseNonStream } from '../services/aiService.js';
import { recordActivity } from '../services/streakService.js';
import { AppError } from '../middleware/errorHandler.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const updateDailyStats = async (userId, doubtsDelta = 1, timeDelta = 0, topics = []) => {
  const today = startOfDay(new Date());
  await LearningStatistics.findOneAndUpdate(
    { userId, date: today },
    {
      $inc: { doubtsSolved: doubtsDelta, studyTimeMinutes: timeDelta },
      $addToSet: { topicsCovered: { $each: topics } },
    },
    { upsert: true }
  );
};

export const createSession = async (req, res, next) => {
  try {
    const { title, mode, pdfId } = req.body;
    const session = await ChatSession.create({
      userId: req.user.id,
      title: title || 'New Chat',
      mode: mode || 'syllabus',
      pdfId: pdfId || null,
      aiProvider: 'ollama',
    });
    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

export const listSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ lastMessageAt: -1 })
      .lean();
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate('pdfId', 'originalName')
      .lean();

    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, session, messages });
  } catch (err) {
    next(err);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const allowed = {};
    if (req.body.mode && ['syllabus', 'open'].includes(req.body.mode)) allowed.mode = req.body.mode;
    if (req.body.pdfId !== undefined) allowed.pdfId = req.body.pdfId || null;
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: allowed },
      { new: true }
    )
      .populate('pdfId', 'originalName')
      .lean();
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    await ChatMessage.deleteMany({ sessionId: req.params.id });
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const sessionId = req.params.id;

    const session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');

    const userMsg = await ChatMessage.create({
      sessionId,
      role: 'user',
      content: content?.trim() || '',
    });

    const history = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('role content')
      .lean();

    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const wantsStream = req.headers.accept?.includes('text/event-stream');

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const stream = getAIResponse(messages, session.mode, session.pdfId);

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.content || '';
        if (delta) {
          fullContent += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      const aiMsg = await ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: fullContent,
      });

      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessageAt: new Date(),
        title: session.title === 'New Chat' ? content?.substring(0, 50) || 'New Chat' : session.title,
      });

      await updateDailyStats(req.user.id, 1, 2);
      await recordActivity(req.user.id);

      res.write(`data: ${JSON.stringify({ done: true, messageId: aiMsg._id })}\n\n`);
      res.end();
    } else {
      const aiContent = await getAIResponseNonStream(messages, session.mode, session.pdfId);

      const aiMsg = await ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: aiContent,
      });

      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessageAt: new Date(),
        title: session.title === 'New Chat' ? content?.substring(0, 50) || 'New Chat' : session.title,
      });

      await updateDailyStats(req.user.id, 1, 2);
      await recordActivity(req.user.id);

      res.json({
        success: true,
        userMessage: userMsg,
        aiMessage: aiMsg,
      });
    }
  } catch (err) {
    next(err);
  }
};
