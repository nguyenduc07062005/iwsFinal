import { cn } from '@/lib/utils.js';

export function AppSkeleton({ circle = false, className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white/70 shadow-[var(--shadow-inset)]',
        circle ? 'rounded-full' : 'rounded-2xl',
        className,
      )}
      {...props}
    />
  );
}
