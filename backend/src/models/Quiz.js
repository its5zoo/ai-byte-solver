import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'short'],
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: [String],
    correctOption: Number,
    correctAnswer: String,
    topic: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      default: null,
    },
    title: {
      type: String,
      default: 'Quiz',
    },
    difficulty: {
      type: String,
      enum: ['mixed', 'easy', 'medium', 'hard'],
      default: 'mixed',
    },
    questions: [quizQuestionSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

quizSchema.index({ userId: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
