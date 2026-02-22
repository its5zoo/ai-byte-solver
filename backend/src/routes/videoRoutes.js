import express from 'express';
import {
    searchVideos,
    getHistory,
    addToHistory,
    getSaved,
    toggleSave
} from '../controllers/videoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchVideos);

router.get('/history', getHistory);
router.post('/history', addToHistory);

router.get('/saved', getSaved);
router.post('/saved', toggleSave);

export default router;
