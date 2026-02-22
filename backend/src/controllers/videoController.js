import ytSearch from 'yt-search';
import VideoLearning from '../models/VideoLearning.js';

export const searchVideos = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: { message: 'Search query is required' } });
        }

        // We search YouTube for the term.
        const r = await ytSearch(q);

        // Filter to just videos and playlists (if available)
        const videos = r.videos.slice(0, 20).map(v => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            channelTitle: v.author?.name || '',
            duration: v.timestamp || '',
            type: 'video'
        }));

        // ytSearch also returns playlists
        const playlists = (r.lists || []).slice(0, 10).map(p => ({
            videoId: p.listId,
            title: p.title,
            thumbnail: p.thumbnail,
            channelTitle: p.author?.name || '',
            duration: `${p.videoCount} videos`,
            type: 'playlist'
        }));

        res.json({ videos, playlists });
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ error: { message: 'Unauthorized' } });

        let record = await VideoLearning.findOne({ userId: req.user._id });
        if (!record) {
            record = await VideoLearning.create({ userId: req.user._id, history: [], saved: [] });
        }

        // Return history sorted visually if needed, though they are stored in order
        res.json({ history: record.history });
    } catch (error) {
        next(error);
    }
};

export const addToHistory = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ error: { message: 'Unauthorized' } });

        const { videoId, title, thumbnail, channelTitle, duration } = req.body;
        if (!videoId || !title) return res.status(400).json({ error: { message: 'Missing videoId or title' } });

        let record = await VideoLearning.findOne({ userId: req.user._id });
        if (!record) {
            record = await VideoLearning.create({ userId: req.user._id, history: [], saved: [] });
        }

        // Remove from history if already exists so we can bump to top
        record.history = record.history.filter(h => h.videoId !== videoId);

        // Unshift to put at the beginning
        record.history.unshift({ videoId, title, thumbnail, channelTitle, duration, watchedAt: Date.now() });

        // Cap at 100 history items
        if (record.history.length > 100) {
            record.history = record.history.slice(0, 100);
        }

        await record.save();

        res.json({ history: record.history });
    } catch (error) {
        next(error);
    }
};

export const getSaved = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ error: { message: 'Unauthorized' } });

        let record = await VideoLearning.findOne({ userId: req.user._id });
        if (!record) {
            record = await VideoLearning.create({ userId: req.user._id, history: [], saved: [] });
        }

        res.json({ saved: record.saved });
    } catch (error) {
        next(error);
    }
};

export const toggleSave = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ error: { message: 'Unauthorized' } });

        const { videoId, title, thumbnail, channelTitle, duration, type } = req.body;
        if (!videoId || !title) return res.status(400).json({ error: { message: 'Missing videoId or title' } });

        let record = await VideoLearning.findOne({ userId: req.user._id });
        if (!record) {
            record = await VideoLearning.create({ userId: req.user._id, history: [], saved: [] });
        }

        const existingIndex = record.saved.findIndex(s => s.videoId === videoId);
        let isSaved = false;

        if (existingIndex >= 0) {
            // Unsave
            record.saved.splice(existingIndex, 1);
        } else {
            // Save
            record.saved.unshift({ videoId, title, thumbnail, channelTitle, duration, type: type || 'video', savedAt: Date.now() });
            isSaved = true;
        }

        await record.save();

        res.json({ isSaved, saved: record.saved });
    } catch (error) {
        next(error);
    }
};
