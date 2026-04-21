import type { PropsWithChildren } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PublicLayoutProps extends PropsWithChildren {
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-base-50)]">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-50/60 to-transparent" />
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={cn('relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}
      >
        {children}
      </motion.main>
    </div>
  );
}

export default PublicLayout;
