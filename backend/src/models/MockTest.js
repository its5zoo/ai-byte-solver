import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        examId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        durationMinutes: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['in-progress', 'completed'],
            default: 'in-progress',
        },
        score: {
            type: Number,
            default: 0,
        },
        totalQuestions: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        incorrectAnswers: {
            type: Number,
            default: 0,
        },
        questions: [
            {
                text: { type: String, required: true },
                options: [{ type: String }],
                correctAnswerIndex: { type: Number, required: true },
                userAnswerIndex: { type: Number, default: null }, // null means unattempted
                difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
                explanation: { type: String },
                topic: { type: String },
                subject: { type: String },
            },
        ],
    },
    { timestamps: true }
);

mockTestSchema.index({ userId: 1, createdAt: -1 });

const MockTest = mongoose.model('MockTest', mockTestSchema);
export default MockTest;
