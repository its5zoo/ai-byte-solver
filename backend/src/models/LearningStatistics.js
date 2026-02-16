import mongoose from 'mongoose';

const learningStatisticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    doubtsSolved: {
      type: Number,
      default: 0,
    },
    studyTimeMinutes: {
      type: Number,
      default: 0,
    },
    topicsCovered: [String],
    quizAttempts: {
      type: Number,
      default: 0,
    },
    quizCorrect: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false }
);

learningStatisticsSchema.index({ userId: 1, date: -1 }, { unique: true });

const LearningStatistics = mongoose.model('LearningStatistics', learningStatisticsSchema);
export default LearningStatistics;
