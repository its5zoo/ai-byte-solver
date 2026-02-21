import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import * as mockTestController from '../controllers/mockTestController.js';

const router = Router();

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: errors.array()[0]?.msg }
        });
    }
    next();
};

router.use(protect);

// Get all mock tests for user
router.get('/', mockTestController.listMockTests);

// Get a specific mock test
router.get('/:id', mockTestController.getMockTest);

// Generate a new mock test
router.post(
    '/generate',
    [body('examId').isString().notEmpty().withMessage('Exam ID is required')],
    validate,
    mockTestController.generateMockTest
);

// Submit a mock test for scoring
router.post(
    '/:id/submit',
    [body('answers').isArray().withMessage('Answers array is required')],
    validate,
    mockTestController.submitMockTest
);

export default router;
