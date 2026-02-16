import StudyStreak from '../models/StudyStreak.js';

export const getStreak = async (req, res, next) => {
  try {
    let streak = await StudyStreak.findOne({ userId: req.user.id }).lean();
    if (!streak) {
      streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        totalStudyDays: 0,
      };
    }
    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        weeklyActivity: streak.weeklyActivity,
        totalStudyDays: streak.totalStudyDays,
      },
    });
  } catch (err) {
    next(err);
  }
};
