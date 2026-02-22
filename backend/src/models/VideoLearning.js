import mongoose from 'mongoose';

const videoLearningSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    history: [{
        videoId: { type: String, required: true },
        title: { type: String, required: true },
        thumbnail: { type: String },
        channelTitle: { type: String },
        duration: { type: String },
        watchedAt: { type: Date, default: Date.now },
    }],
    saved: [{
        videoId: { type: String, required: true },
        title: { type: String, required: true },
        thumbnail: { type: String },
        channelTitle: { type: String },
        duration: { type: String },
        type: { type: String, enum: ['video', 'playlist'], default: 'video' },
        savedAt: { type: Date, default: Date.now },
    }]
}, { timestamps: true });

export default mongoose.model('VideoLearning', videoLearningSchema);
