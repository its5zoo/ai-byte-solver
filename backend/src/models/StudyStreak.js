import mongoose from 'mongoose';

const studyStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    weeklyActivity: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
    },
    totalStudyDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { updatedAt: true } }
);

// unique: true on userId already creates the index

const StudyStreak = mongoose.model('StudyStreak', studyStreakSchema);
export default StudyStreak;
