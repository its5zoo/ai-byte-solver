import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        question: {
            type: String,
            required: true,
            trim: true,
        },
        topic: {
            type: String,
            required: true,
            index: true,
        },
        frequency: {
            type: Number,
            default: 1,
        },
        lastAsked: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index to quickly find specific question for a user
doubtSchema.index({ userId: 1, question: 1 }, { unique: true });
// Index for fetching top doubts
doubtSchema.index({ userId: 1, frequency: -1 });

const Doubt = mongoose.model('Doubt', doubtSchema);
export default Doubt;
