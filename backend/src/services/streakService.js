import StudyStreak from '../models/StudyStreak.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDateKey = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export const recordActivity = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await StudyStreak.findOne({ userId });
  if (!streak) {
    streak = await StudyStreak.create({ userId });
  }

  const lastKey = streak.lastActiveDate ? getDateKey(streak.lastActiveDate) : null;
  const todayKey = getDateKey(today);

  if (lastKey === todayKey) {
    return streak;
  }

  const dayOfWeek = today.getDay();
  const weekly = [...(streak.weeklyActivity || [0, 0, 0, 0, 0, 0, 0])];
  weekly[dayOfWeek] = (weekly[dayOfWeek] || 0) + 1;

  let newCurrent = streak.currentStreak;
  if (!lastKey) {
    newCurrent = 1;
  } else {
    const diffDays = Math.round((todayKey - lastKey) / MS_PER_DAY);
    if (diffDays === 1) {
      newCurrent = streak.currentStreak + 1;
    } else if (diffDays > 1) {
      newCurrent = 1;
    }
  }

  const newLongest = Math.max(streak.longestStreak || 0, newCurrent);

  streak.currentStreak = newCurrent;
  streak.longestStreak = newLongest;
  streak.lastActiveDate = today;
  streak.weeklyActivity = weekly;
  streak.totalStudyDays = (streak.totalStudyDays || 0) + 1;
  await streak.save();

  return streak;
};
