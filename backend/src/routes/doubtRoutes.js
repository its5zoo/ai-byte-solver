import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as doubtController from '../controllers/doubtController.js';

const router = Router();

router.use(protect);

router.get('/', doubtController.getTopDoubts);

export default router;
