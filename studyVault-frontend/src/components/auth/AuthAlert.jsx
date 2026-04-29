import { cn } from '@/lib/utils.js';

const tones = {
  error: 'border-rose-200 bg-rose-50/90 text-rose-700',
  info: 'border-brand-100 bg-brand-50/90 text-brand-600',
  success: 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
};

const AuthAlert = ({ tone = 'error', children }) => {
  return (
    <div
      className={cn(
        'rounded-[1.15rem] border px-4 py-3 text-sm font-medium',
        tones[tone],
      )}
    >
      {children}
    </div>
  );
};

export default AuthAlert;
