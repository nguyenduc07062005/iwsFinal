import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppFieldErrorProps {
  message?: string;
  className?: string;
}

export function AppFieldError({ message, className }: AppFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm font-medium text-rose-500', className)}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

export default AppFieldError;
