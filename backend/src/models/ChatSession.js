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
    aiProvider: {
      type: String,
      enum: ['ollama', 'gemini'],
      default: 'ollama',
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedPDF',
      default: null,
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
