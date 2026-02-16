import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: Number,
        shortAnswer: String,
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ quizId: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
