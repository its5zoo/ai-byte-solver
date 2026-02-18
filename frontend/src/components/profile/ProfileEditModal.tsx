import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string | null | undefined;
  onSave: (data: { name: string; avatar?: string | null }) => Promise<void>;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onSave,
}: ProfileEditModalProps) {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState<string | null | undefined>(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setAvatar(currentAvatar);
      setError('');
    }
  }, [isOpen, currentName, currentAvatar]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: trimmedName, avatar });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const initials = name?.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                'flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-4 ring-gray-200 dark:ring-gray-700',
                avatar ? 'bg-gray-100' : 'bg-emerald-100 text-2xl font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              )}
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload photo
              </Button>
              {avatar && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG or WebP. Max 2 MB.</p>
          </div>

          <div>
            <label htmlFor="edit-name" className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
