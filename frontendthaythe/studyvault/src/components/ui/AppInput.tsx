import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name;

    return (
      <label className={cn('flex w-full flex-col gap-2', wrapperClassName)} htmlFor={inputId}>
        {label ? (
          <span className="text-sm font-bold text-slate-700">{label}</span>
        ) : null}

        <div
          className={cn(
            'glass flex min-h-12 items-center gap-3 rounded-[1.5rem] px-4 shadow-sm transition-all duration-300 focus-within:-translate-y-0.5 focus-within:shadow-md focus-within:ring-2 focus-within:ring-brand-500/15',
            error ? 'border border-rose-200 ring-2 ring-rose-100' : 'border border-white/50',
          )}
        >
          {leftIcon ? <span className="text-slate-400">{leftIcon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-transparent py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400',
              className,
            )}
            {...props}
          />
          {rightIcon ? <span className="text-slate-400">{rightIcon}</span> : null}
        </div>

        {error ? (
          <span className="text-sm font-medium text-rose-500">{error}</span>
        ) : hint ? (
          <span className="text-sm font-medium text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  },
);

AppInput.displayName = 'AppInput';

export default AppInput;
