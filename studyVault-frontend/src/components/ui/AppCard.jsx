import { cn } from '@/lib/utils.js';

const toneClasses = {
  glass: 'glass floating-ring',
  solid: 'border border-slate-200 bg-white shadow-[var(--shadow-soft)]',
  brand:
    'bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 text-white shadow-[var(--shadow-brand)]',
  dark: 'glass-dark text-white shadow-[var(--shadow-glass)]',
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function AppCard({
  children,
  className,
  interactive = false,
  padding = 'md',
  tone = 'glass',
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-panel)] transition-all duration-300',
        toneClasses[tone],
        paddingClasses[padding],
        interactive &&
          'cursor-pointer hover:-translate-y-1 hover:shadow-[var(--shadow-medium)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
