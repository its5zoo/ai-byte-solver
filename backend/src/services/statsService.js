import LearningStatistics from '../models/LearningStatistics.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatSession from '../models/ChatSession.js';
import QuizAttempt from '../models/QuizAttempt.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const getSummary = async (userId) => {
  const stats = await LearningStatistics.find({ userId }).lean();
  const totalDoubts = stats.reduce((s, x) => s + (x.doubtsSolved || 0), 0);
  const totalTime = stats.reduce((s, x) => s + (x.studyTimeMinutes || 0), 0);
  const totalQuiz = stats.reduce((s, x) => s + (x.quizAttempts || 0), 0);
  const totalQuizCorrect = stats.reduce((s, x) => s + (x.quizCorrect || 0), 0);

  const topics = new Set();
  stats.forEach((s) => (s.topicsCovered || []).forEach((t) => topics.add(t)));

  const attempts = await QuizAttempt.find({ userId }).lean();
  const avgQuiz =
    attempts.length > 0
      ? attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length
      : 0;

  return {
    doubtsSolved: totalDoubts,
    studyTimeMinutes: totalTime,
    topicsCovered: topics.size,
    quizAttempts: totalQuiz,
    quizCorrect: totalQuizCorrect,
    averageQuizScore: Math.round(avgQuiz * 10) / 10,
    accuracyPercent: totalQuiz > 0 ? Math.round((totalQuizCorrect / totalQuiz) * 100) : 0,
  };
};

export const getTimeline = async (userId, range = 'week') => {
  const now = new Date();
  let start;
  if (range === 'day') start = addDays(now, -1);
  else if (range === 'week') start = addDays(now, -7);
  else start = addDays(now, -30);

  const stats = await LearningStatistics.find({
    userId,
    date: { $gte: startOfDay(start), $lte: now },
  })
    .sort({ date: 1 })
    .lean();

  return stats.map((s) => ({
    date: s.date,
    doubtsSolved: s.doubtsSolved || 0,
    studyTimeMinutes: s.studyTimeMinutes || 0,
    quizAttempts: s.quizAttempts || 0,
    quizCorrect: s.quizCorrect || 0,
  }));
};

export const getTopicCoverage = async (userId) => {
  const stats = await LearningStatistics.find({ userId }).lean();
  const map = {};
  stats.forEach((s) => {
    (s.topicsCovered || []).forEach((t) => {
      map[t] = (map[t] || 0) + 1;
    });
  });
  return Object.entries(map).map(([topic, count]) => ({ topic, count }));
};

export const getQuizPerformance = async (userId) => {
  const attempts = await QuizAttempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('quizId', 'title')
    .lean();

  return attempts.map((a) => ({
    quizId: a.quizId?._id,
    title: a.quizId?.title || 'Quiz',
    score: a.score,
    total: a.total,
    percentage: a.percentage,
    completedAt: a.createdAt,
  }));
};
