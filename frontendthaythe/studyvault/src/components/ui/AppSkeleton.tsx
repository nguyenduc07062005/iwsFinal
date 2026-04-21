import { cn } from '../../lib/utils';

interface AppSkeletonProps {
  className?: string;
}

export function AppSkeleton({ className }: AppSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[1.25rem] bg-gradient-to-r from-white/60 via-white/90 to-white/60 shadow-sm',
        className,
      )}
    />
  );
}

export default AppSkeleton;
