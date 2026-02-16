import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import UploadedPDF from '../models/UploadedPDF.js';
import { processPDF, ensureUploadDir, deletePDFFile } from '../services/pdfService.js';
import { AppError } from '../middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError('Only PDF files are allowed', 422, 'INVALID_FILE_TYPE'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const uploadPDF = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 422, 'NO_FILE');
    }

    const pdf = await processPDF(
      req.file.path,
      req.user.id,
      req.file.originalname
    );

    res.status(201).json({
      success: true,
      pdf: {
        id: pdf._id,
        filename: pdf.filename,
        originalName: pdf.originalName,
        size: pdf.size,
        pages: pdf.pages,
        extractedText: pdf.extractedText?.substring(0, 500) + (pdf.extractedText?.length > 500 ? '...' : ''),
        topics: pdf.topics,
        uploadedAt: pdf.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listPDFs = async (req, res, next) => {
  try {
    const pdfs = await UploadedPDF.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-extractedText')
      .lean();

    res.json({ success: true, pdfs });
  } catch (err) {
    next(err);
  }
};

export const getPDF = async (req, res, next) => {
  try {
    const pdf = await UploadedPDF.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!pdf) {
      throw new AppError('PDF not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, pdf });
  } catch (err) {
    next(err);
  }
};

export const deletePDF = async (req, res, next) => {
  try {
    const pdf = await UploadedPDF.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404, 'NOT_FOUND');
    }

    await deletePDFFile(pdf.filename);
    res.json({ success: true, message: 'PDF deleted' });
  } catch (err) {
    next(err);
  }
};
