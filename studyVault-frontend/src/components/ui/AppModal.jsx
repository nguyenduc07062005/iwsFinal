import { AnimatePresence, motion as Motion } from 'motion/react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils.js';
import { emphasisEase } from '@/lib/motion.js';

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
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: emphasisEase }}
            className={cn(
              'floating-ring relative max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.48)] sm:px-6 sm:py-6',
              sizeClasses[size],
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <Motion.button
              type="button"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2, ease: emphasisEase }}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
              aria-label="Close modal"
            >
              <X className="h-[18px] w-[18px]" />
            </Motion.button>

            {title ? (
              <Motion.h2
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08, ease: emphasisEase }}
                className="pr-12 text-2xl font-extrabold tracking-tight text-slate-900"
              >
                {title}
              </Motion.h2>
            ) : null}
            {description ? (
              <Motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.14, ease: emphasisEase }}
                className="mt-1 max-w-md pr-12 text-sm font-semibold leading-6 text-slate-600"
              >
                {description}
              </Motion.p>
            ) : null}

            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18, ease: emphasisEase }}
              className={cn(title ? 'mt-5' : 'mt-0')}
            >
              {children}
            </Motion.div>

            {footer ? (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.24, ease: emphasisEase }}
                className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"
              >
                {footer}
              </Motion.div>
            ) : null}
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
