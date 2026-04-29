import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  name,
  icon,
  autoComplete,
  required = true,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            'control-surface w-full rounded-[var(--radius-control)] px-4 py-3.5 pr-14 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-brand-200 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-500/15',
            icon && 'pl-12',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-slate-400 transition-all hover:text-brand-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
};

export default PasswordField;
