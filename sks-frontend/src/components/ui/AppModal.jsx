import { AnimatePresence, motion as Motion } from 'motion/react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils.js';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function AppModal({
  children,
  footer,
  onClose,
  open,
  size = 'sm',
  title,
}) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-md"
          onClick={onClose}
        >
          <Motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'glass floating-ring relative w-full overflow-hidden rounded-[1.75rem] border-white/80 px-5 py-5 shadow-[var(--shadow-glass)] sm:px-6',
              sizeClasses[size],
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-500"
              aria-label="Close modal"
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            {title ? (
              <h2 className="pr-12 text-2xl font-extrabold tracking-tight text-slate-900">
                {title}
              </h2>
            ) : null}

            <div className={cn(title ? 'mt-5' : 'mt-0')}>{children}</div>

            {footer ? <div className="mt-5 flex flex-wrap justify-end gap-3">{footer}</div> : null}
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
