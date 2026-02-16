import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';
import UploadedPDF from '../models/UploadedPDF.js';
import { AppError } from '../middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

export const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

export const processPDF = async (filePath, userId, originalName) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);

  const filename = path.basename(filePath);
  const pdf = await UploadedPDF.create({
    userId,
    filename,
    originalName,
    size: buffer.length,
    pages: data.numpages || 0,
    extractedText: data.text || '',
    topics: extractTopics(data.text),
  });

  return pdf;
};

const extractTopics = (text) => {
  if (!text) return [];
  const lines = text.split(/\n/).filter((l) => l.trim().length > 10);
  const topics = [];
  const headingPattern = /^(?:Chapter|Unit|Topic|Section)\s*\d*[.:]?\s*(.+)/i;
  lines.slice(0, 50).forEach((line) => {
    const m = line.match(headingPattern);
    if (m && m[1].length < 80) topics.push(m[1].trim());
  });
  return [...new Set(topics)].slice(0, 20);
};

export const deletePDFFile = async (filename) => {
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch (_) {}
};
