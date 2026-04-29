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
  description,
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'floating-ring relative max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-[1.5rem] border border-white/90 bg-white/95 px-5 py-5 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.48)] sm:px-6 sm:py-6',
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
            {description ? (
              <p className="mt-1 max-w-md pr-12 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            ) : null}

            <div className={cn(title ? 'mt-5' : 'mt-0')}>{children}</div>

            {footer ? (
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            ) : null}
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
