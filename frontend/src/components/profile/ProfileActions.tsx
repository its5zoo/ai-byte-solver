import { LogOut } from 'lucide-react';
import Button from '../ui/Button';

interface ProfileActionsProps {
  onLogout: () => void;
  onDeleteAccount?: () => void;
}

export default function ProfileActions({ onLogout, onDeleteAccount }: ProfileActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button
        variant="primary"
        className="gap-2"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
      {onDeleteAccount && (
        <button
          type="button"
          onClick={onDeleteAccount}
          className="text-sm text-[hsl(var(--foreground-tertiary))] underline-offset-2 hover:text-red-500 hover:underline transition-colors"
        >
          Delete account
        </button>
      )}
    </div>
  );
}
