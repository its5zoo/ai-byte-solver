import express from 'express';
import { protect } from '../middleware/auth.js';

import { routeAiRequest } from '../services/aiRouterService.js';

const router = express.Router();

router.use(protect);

/**
 * POST /api/v1/ai-router
 * Body: { projectFiles, activeFile, userPrompt, terminalOutput, selectedModel, mode }
 */
router.post('/', async (req, res, next) => {
    try {
        const { projectFiles, activeFile, userPrompt, terminalOutput, selectedModel, mode } = req.body;
        const result = await routeAiRequest({
            projectFiles,
            activeFile,
            userPrompt,
            terminalOutput,
            selectedModel,
            mode: mode || 'chat',
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
