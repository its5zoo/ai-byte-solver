import * as statsService from '../services/statsService.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await statsService.getSummary(req.user.id);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

export const getTimeline = async (req, res, next) => {
  try {
    const range = req.query.range || 'week';
    const timeline = await statsService.getTimeline(req.user.id, range);
    res.json({ success: true, timeline });
  } catch (err) {
    next(err);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const topics = await statsService.getTopicCoverage(req.user.id);
    res.json({ success: true, topics });
  } catch (err) {
    next(err);
  }
};

export const getQuizPerformance = async (req, res, next) => {
  try {
    const performance = await statsService.getQuizPerformance(req.user.id);
    res.json({ success: true, performance });
  } catch (err) {
    next(err);
  }
};
