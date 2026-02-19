import { Pencil } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatar?: string | null;
  onEditClick?: () => void;
}

export default function ProfileHeader({ name, email, avatar, onEditClick }: ProfileHeaderProps) {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-[hsl(var(--glass-border))] px-6 py-8',
        'glass shadow-lg'
      )}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div
          className={cn(
            'flex h-24 w-24 shrink-0 items-center justify-center rounded-full ring-4 ring-[hsl(var(--glass-border))]',
            'bg-[hsl(var(--primary-light))] text-2xl font-semibold text-[hsl(var(--primary))]'
          )}
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-2xl">
            {name || 'Student'}
          </h1>
          <p className="mt-0.5 text-sm text-[hsl(var(--foreground-secondary))]">{email}</p>
          {onEditClick && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={onEditClick}
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
