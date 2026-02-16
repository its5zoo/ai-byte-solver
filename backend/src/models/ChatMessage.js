import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: null,
    },
    sources: [
      {
        pdfId: mongoose.Schema.Types.ObjectId,
        pdfName: String,
        chapter: String,
        topic: String,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
