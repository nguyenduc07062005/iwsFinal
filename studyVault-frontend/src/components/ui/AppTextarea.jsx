import { cn } from '@/lib/utils.js';

export function AppTextarea({
  className,
  error,
  hint,
  icon,
  label,
  wrapperClassName,
  ...props
}) {
  return (
    <label className={cn('flex w-full flex-col gap-2', wrapperClassName)}>
      {label ? (
        <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
          {label}
        </span>
      ) : null}

      <span className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-4 text-slate-500">
            {icon}
          </span>
        ) : null}
        <textarea
          className={cn(
            'control-surface min-h-28 w-full resize-none rounded-[1.1rem] px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-brand-600 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-600/20',
            icon && 'pl-12',
            error &&
              'border border-rose-200 bg-rose-50/70 text-rose-700 placeholder:text-rose-300 focus:border-rose-300 focus:ring-rose-400/10',
            className,
          )}
          {...props}
        />
      </span>

      {error ? (
        <span className="pl-1 text-xs font-bold text-rose-600">{error}</span>
      ) : hint ? (
        <span className="pl-1 text-xs font-semibold text-slate-600">{hint}</span>
      ) : null}
    </label>
  );
}
