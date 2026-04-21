import type { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface DetailLayoutProps extends PropsWithChildren {
  header?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function DetailLayout({
  header,
  sidebar,
  children,
  className,
}: DetailLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-base-50)]">
      {header ? (
        <div className="sticky top-0 z-40 border-b border-white/50 bg-[var(--color-base-50)]/85 backdrop-blur-xl">
          {header}
        </div>
      ) : null}

      <div
        className={cn(
          'mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8',
          className,
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <main className="min-w-0">{children}</main>
          {sidebar ? <aside className="space-y-4">{sidebar}</aside> : null}
        </motion.div>
      </div>
    </div>
  );
}

export default DetailLayout;
