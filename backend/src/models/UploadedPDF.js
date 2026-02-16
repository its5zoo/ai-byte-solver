import mongoose from 'mongoose';

const uploadedPDFSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    pages: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    topics: [String],
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

uploadedPDFSchema.index({ userId: 1, createdAt: -1 });

const UploadedPDF = mongoose.model('UploadedPDF', uploadedPDFSchema);
export default UploadedPDF;
