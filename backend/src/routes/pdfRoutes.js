import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as pdfController from '../controllers/pdfController.js';

const router = Router();

router.use(protect);

router.post('/upload', pdfController.upload.single('file'), pdfController.uploadPDF);
router.get('/', pdfController.listPDFs);
router.get('/:id', pdfController.getPDF);
router.delete('/:id', pdfController.deletePDF);

export default router;
