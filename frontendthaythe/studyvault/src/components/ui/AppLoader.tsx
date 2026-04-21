import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppLoaderProps {
  label?: string;
  className?: string;
}

export function AppLoader({
  label = 'Đang tải dữ liệu...',
  className,
}: AppLoaderProps) {
  return (
    <div className={cn('flex items-center gap-3 text-slate-500', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export default AppLoader;
