import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AppSectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function AppSection({
  className,
  title,
  description,
  action,
  children,
  ...props
}: AppSectionProps) {
  return (
    <section className={cn('space-y-6', className)} {...props}>
      {(title || description || action) && (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            {title ? (
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export default AppSection;
