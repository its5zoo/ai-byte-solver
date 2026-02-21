import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as quizController from '../controllers/quizController.js';

const router = Router();

router.use(protect);

router.post('/generate', quizController.generate);
router.post('/custom-generate', quizController.generateCustom);
router.get('/attempts', quizController.listAttempts);
router.get('/:id', quizController.getQuiz);
router.post('/:id/attempt', quizController.submitAttempt);

export default router;
