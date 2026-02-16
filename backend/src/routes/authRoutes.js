import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

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

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name required'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  authController.login
);

router.post(
  '/google',
  [body('credential').notEmpty().withMessage('Google credential required')],
  validate,
  authController.googleAuth
);

router.get('/me', protect, authController.getMe);

export default router;
