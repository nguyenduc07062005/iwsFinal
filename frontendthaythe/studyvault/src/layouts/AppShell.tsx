import type { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AppShellProps extends PropsWithChildren {
  header?: ReactNode;
  sidebar?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

export function AppShell({
  header,
  sidebar,
  toolbar,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-base-50)]">
      {header ? <div className="sticky top-0 z-40 border-b border-white/50 bg-[var(--color-base-50)]/80 backdrop-blur-xl">{header}</div> : null}
      <div className={cn('mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8', className)}>
        {toolbar ? <div>{toolbar}</div> : null}
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {sidebar ? <aside className="space-y-4">{sidebar}</aside> : null}
          <motion.main
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-w-0"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
