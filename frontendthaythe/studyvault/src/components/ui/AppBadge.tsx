import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

const badgeClasses: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-900 border border-brand-100',
  neutral: 'bg-white/70 text-slate-700 border border-white/60',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border border-rose-100',
};

interface AppBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function AppBadge({
  className,
  variant = 'neutral',
  children,
  ...props
}: AppBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide',
        badgeClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default AppBadge;
