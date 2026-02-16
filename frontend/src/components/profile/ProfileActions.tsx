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
        variant="default"
        className="gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
      {onDeleteAccount && (
        <button
          type="button"
          onClick={onDeleteAccount}
          className="text-sm text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-300"
        >
          Delete account
        </button>
      )}
    </div>
  );
}
