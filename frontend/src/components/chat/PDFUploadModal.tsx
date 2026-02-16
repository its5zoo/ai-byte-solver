import { useState, useRef, useCallback } from 'react';
import { X, FileText, Upload, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

const MAX_SIZE_MB = 25;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  pdfs: { _id: string; originalName: string }[];
}

export default function PDFUploadModal({
  isOpen,
  onClose,
  onUpload,
  pdfs,
}: PDFUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((f: File): string => {
    if (f.type !== 'application/pdf') return 'Only PDF files are allowed.';
    if (f.size > MAX_BYTES) return `File must be under ${MAX_SIZE_MB} MB.`;
    return '';
  }, []);

  const handleFile = useCallback(
    (f: File | null) => {
      setError('');
      setSuccess(false);
      if (!f) {
        setFile(null);
        return;
      }
      const err = validate(f);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setFile(f);
    },
    [validate]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await onUpload(file);
      setFile(null);
      setSuccess(true);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Upload failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Syllabus PDF</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
            file
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {file ? file.name : 'Drop PDF or browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Max {MAX_SIZE_MB} MB</p>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            PDF uploaded and saved successfully.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>

        {pdfs.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Your PDFs</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {pdfs.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
                >
                  <FileText className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="truncate">{p.originalName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
