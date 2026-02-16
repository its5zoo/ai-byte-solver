import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.use(protect);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

export default router;
