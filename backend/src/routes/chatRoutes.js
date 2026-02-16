import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import * as chatController from '../controllers/chatController.js';

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: errors.array()[0]?.msg },
    });
  }
  next();
};

router.use(protect);

router.post('/sessions', chatController.createSession);
router.get('/sessions', chatController.listSessions);
router.get('/sessions/:id', chatController.getSession);
router.patch('/sessions/:id', chatController.updateSession);
router.delete('/sessions/:id', chatController.deleteSession);
router.post(
  '/sessions/:id/messages',
  [body('content').trim().notEmpty().withMessage('Content required')],
  validate,
  chatController.sendMessage
);

export default router;
