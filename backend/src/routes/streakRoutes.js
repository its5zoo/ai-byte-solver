import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as streakController from '../controllers/streakController.js';

const router = Router();

router.use(protect);

router.get('/', streakController.getStreak);

export default router;
