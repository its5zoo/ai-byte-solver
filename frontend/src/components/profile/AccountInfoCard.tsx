import { Mail, User, Calendar, LogIn } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface AccountInfoCardProps {
  name: string;
  email: string;
  loginMethod: 'Google' | 'Email' | 'College ID';
  createdAt?: string | null;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function AccountInfoCard({
  name,
  email,
  loginMethod,
  createdAt,
}: AccountInfoCardProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Your account details</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          <InfoRow icon={User} label="Name" value={name || '—'} />
          <InfoRow icon={Mail} label="Email" value={email || '—'} />
          <InfoRow icon={LogIn} label="Login Method" value={loginMethod} />
          {formattedDate && (
            <InfoRow icon={Calendar} label="Account Created" value={formattedDate} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
