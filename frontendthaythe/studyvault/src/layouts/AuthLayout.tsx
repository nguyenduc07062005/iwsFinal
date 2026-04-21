import type { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'motion/react';
import { BookOpenText } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
}

export function AuthLayout({
  title,
  description,
  aside,
  children,
  className,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-base-50)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl" />

      <div className={cn('relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center', className)}>
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="hidden rounded-[2rem] p-8 lg:block"
        >
          <div className="glass flex max-w-xl flex-col rounded-[2rem] border border-white/50 p-8 shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-white text-brand-500 shadow-sm">
              <BookOpenText size={26} />
            </div>
            <span className="mb-3 inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-900">
              StudyVault
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Thiết kế học tập cao cấp, trải nghiệm mượt mà.</h1>
            <p className="mt-4 text-base font-medium leading-7 text-slate-500">
              Không gian này sẽ là chuẩn giao diện chung cho toàn bộ các màn xác thực, giúp hệ thống đồng bộ, chuyên nghiệp và dễ mở rộng cho các phase tiếp theo.
            </p>
            {aside ? <div className="mt-8">{aside}</div> : null}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-[2rem] border border-white/50 p-6 shadow-sm sm:p-8"
        >
          <div className="mb-8 space-y-3">
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-900">
              Authentication
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{title}</h2>
            <p className="text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
          {children}
        </motion.section>
      </div>
    </div>
  );
}

export default AuthLayout;
