import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { AppButton } from './AppButton';
import { cn } from '../../lib/utils';

interface AppEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AppEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: AppEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass flex flex-col items-center rounded-[2rem] border border-white/40 px-6 py-10 text-center shadow-sm',
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-brand-500 shadow-sm">
          {icon}
        </div>
      ) : null}
      <h3 className="text-xl font-extrabold tracking-tight text-slate-800">{title}</h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton className="mt-6" onClick={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
    </motion.div>
  );
}

export default AppEmptyState;
