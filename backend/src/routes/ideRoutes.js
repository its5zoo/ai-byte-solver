import express from 'express';
import { protect } from '../middleware/auth.js';

import {
    listProjects,
    createProject,
    getProject,
    deleteProject,
    listFiles,
    createFile,
    updateFile,
    deleteFile,
    getProjectHistory,
    saveProjectHistory,
    updateProjectState,
} from '../controllers/ideController.js';

const router = express.Router();

router.use(protect);

// Projects
router.get('/projects', listProjects);
router.post('/projects', createProject);
router.get('/projects/:id', getProject);
router.delete('/projects/:id', deleteProject);

// Files within a project
router.get('/projects/:id/files', listFiles);
router.post('/projects/:id/files', createFile);
router.put('/projects/:id/files/:fid', updateFile);
router.delete('/projects/:id/files/:fid', deleteFile);

// History & State
router.get('/projects/:id/history', getProjectHistory);
router.post('/projects/:id/history', saveProjectHistory);
router.put('/projects/:id/state', updateProjectState);

export default router;
