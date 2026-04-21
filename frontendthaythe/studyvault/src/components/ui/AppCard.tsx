import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  interactive?: boolean;
  glow?: boolean;
}

export function AppCard({
  className,
  children,
  icon,
  interactive = false,
  glow = false,
  ...props
}: AppCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      className={cn(
        'glass relative overflow-hidden rounded-[2rem] border border-white/40 p-6 shadow-sm',
        interactive && 'cursor-pointer transition-all duration-300 hover:shadow-xl',
        className,
      )}
      {...props}
    >
      {glow ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/70 via-transparent to-transparent opacity-80" />
      ) : null}

      <div className="relative z-10">
        {icon ? (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
            {icon}
          </div>
        ) : null}
        {children}
      </div>
    </motion.div>
  );
}

export default AppCard;
