import { cn } from '@/lib/utils.js';

const maxWidthClasses = {
  default: 'max-w-7xl',
  wide: 'max-w-[1440px]',
  narrow: 'max-w-5xl',
};

export function PageContainer({
  children,
  className,
  maxWidth = 'default',
  ...props
}) {
  return (
    <div className="page-shell">
      <div
        className={cn('mx-auto w-full', maxWidthClasses[maxWidth], className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
