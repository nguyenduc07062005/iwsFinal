import { cn } from '@/lib/utils.js';

export function AppSectionHeader({
  actions,
  align = 'left',
  description,
  eyebrow,
  title,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'items-center text-center sm:flex-col sm:items-center',
      )}
    >
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-3 text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
            {description}
          </div>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
