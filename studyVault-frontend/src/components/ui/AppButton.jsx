import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const sizeClasses = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variantClasses = {
  primary:
    'bg-brand-900 text-white shadow-[var(--shadow-brand)] hover:-translate-y-0.5 hover:bg-brand-600',
  secondary:
    'glass text-slate-700 border-white/70 hover:-translate-y-0.5 hover:text-brand-600 hover:shadow-[var(--shadow-medium)]',
  outline:
    'bg-white/85 text-slate-700 border border-slate-200 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600',
  ghost:
    'bg-transparent text-slate-600 shadow-none hover:bg-white/70 hover:text-brand-600',
  danger:
    'bg-rose-600 text-white shadow-[0_22px_55px_-28px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 hover:bg-rose-700',
};

export function AppButton({
  children,
  className,
  disabled,
  fullWidth = false,
  leadingIcon,
  loading = false,
  size = 'md',
  trailingIcon,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-extrabold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
      ) : leadingIcon ? (
        <span className="inline-flex shrink-0">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && trailingIcon ? (
        <span className="inline-flex shrink-0">{trailingIcon}</span>
      ) : null}
    </button>
  );
}
