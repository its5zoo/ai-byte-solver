import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import LearningStatistics from '../models/LearningStatistics.js';
import { generateQuiz, evaluateAttempt } from '../services/quizService.js';
import { recordActivity } from '../services/streakService.js';
import { AppError } from '../middleware/errorHandler.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const generate = async (req, res, next) => {
  try {
    const { sessionId, count = 5, difficulty = 'easy' } = req.body;
    if (!sessionId) throw new AppError('sessionId required', 422, 'VALIDATION_ERROR');

    const quiz = await generateQuiz(req.user.id, sessionId, count, difficulty);

    res.status(201).json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questions: quiz.questions.map((q) => ({
          id: q._id,
          type: q.type,
          question: q.question,
          options: q.options,
          topic: q.topic,
          difficulty: q.difficulty,
        })),
        createdAt: quiz.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .select('-questions.correctOption -questions.correctAnswer')
      .lean();

    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
};

export const submitAttempt = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const result = await evaluateAttempt(req.params.id, req.user.id, answers || []);

    await QuizAttempt.create({
      userId: req.user.id,
      quizId: req.params.id,
      answers: answers || [],
      score: result.score,
      total: result.total,
      percentage: result.percentage,
    });

    const today = startOfDay(new Date());
    await LearningStatistics.findOneAndUpdate(
      { userId: req.user.id, date: today },
      { $inc: { quizAttempts: 1, quizCorrect: result.score } },
      { upsert: true }
    );

    await recordActivity(req.user.id);

    res.json({
      success: true,
      result: {
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        details: result.details,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('quizId', 'title')
      .lean();

    res.json({
      success: true,
      attempts: attempts.map((a) => ({
        id: a._id,
        quizId: a.quizId?._id,
        title: a.quizId?.title,
        score: a.score,
        total: a.total,
        percentage: a.percentage,
        completedAt: a.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};
