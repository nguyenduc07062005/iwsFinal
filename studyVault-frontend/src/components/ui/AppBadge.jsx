import { cn } from '@/lib/utils.js';

const variantClasses = {
  soft: 'bg-brand-50 text-brand-600 border border-brand-100',
  outline: 'bg-white/70 text-slate-600 border border-slate-200',
  solid: 'bg-brand-900 text-white border border-brand-900/10',
  glass: 'glass text-slate-700 border-white/70',
  accent:
    'bg-[color:rgba(184,115,51,0.12)] text-[var(--color-accent)] border border-[color:rgba(184,115,51,0.2)]',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border border-rose-100',
};

const sizeClasses = {
  sm: 'px-2.5 py-1 text-[10px] tracking-[0.18em]',
  md: 'px-3 py-1.5 text-[11px] tracking-[0.22em]',
};

export function AppBadge({
  children,
  className,
  icon,
  size = 'md',
  variant = 'soft',
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-black uppercase',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
