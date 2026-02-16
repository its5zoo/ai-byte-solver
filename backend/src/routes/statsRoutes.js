import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as statsController from '../controllers/statsController.js';

const router = Router();

router.use(protect);

router.get('/summary', statsController.getSummary);
router.get('/timeline', statsController.getTimeline);
router.get('/topics', statsController.getTopics);
router.get('/quiz', statsController.getQuizPerformance);

export default router;
