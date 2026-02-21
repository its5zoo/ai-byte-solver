import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    mode: {
      type: String,
      enum: ['syllabus', 'open'],
      default: 'syllabus',
    },
    category: {
      type: String,
      default: 'general',
    },
    aiProvider: {
      type: String,
      enum: ['ollama', 'deepseek'],
      default: 'ollama',
    },
    pdfIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedPDF',
    }],
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
