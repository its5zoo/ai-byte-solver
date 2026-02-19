import Doubt from '../models/Doubt.js';

// Internal helper to record a doubt
export const recordDoubt = async (userId, question, topic) => {
    try {
        // Normalize question to lowercase/trim to group similar ones somewhat
        const normalizedQuestion = question.trim();

        // We update if exists, or insert if new
        console.log(`[Doubt] Upserting doubt: "${normalizedQuestion}"`);
        await Doubt.findOneAndUpdate(
            { userId, question: normalizedQuestion },
            {
                $inc: { frequency: 1 },
                $set: {
                    topic: topic || 'General',
                    lastAsked: new Date()
                }
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error recording doubt:', error);
        // We don't block the main thread for this background stat update
    }
};

// API to get top frequent doubts
export const getTopDoubts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const doubts = await Doubt.find({ userId: req.user.id })
            .sort({ frequency: -1, lastAsked: -1 })
            .limit(limit)
            .lean();

        res.json({
            success: true,
            doubts,
        });
    } catch (error) {
        next(error);
    }
};
