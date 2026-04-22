import { Link, useLocation } from 'react-router-dom';
import { AppBadge, AppCard } from '@/components/ui/index.js';
import StudyVaultMark from '../navigation/StudyVaultMark.jsx';

const authTabs = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/forgot-password', label: 'Forgot' },
];

const AuthFormShell = ({ eyebrow, title, description, children, footer }) => {
  const location = useLocation();

  return (
    <div className="mx-auto w-full max-w-xl">
      <AppCard className="overflow-hidden" padding="lg" tone="glass">
        <div className="space-y-6">
          <StudyVaultMark subtitle="Premium Learning Workspace" />

          <div className="flex flex-wrap gap-2">
            <AppBadge variant="soft">
              Auth foundation
            </AppBadge>
            <AppBadge variant="glass">
              Premium / Bento / Glass
            </AppBadge>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-600">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] font-black tracking-tight text-slate-900 sm:text-[2.7rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500 sm:text-[15px]">
              {description}
            </p>
          </div>

          <div className="flex rounded-full bg-white/75 p-1 shadow-[var(--shadow-soft)]">
            {authTabs.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-brand-900 text-white shadow-[var(--shadow-brand)]'
                      : 'text-slate-500 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div>{children}</div>
        </div>

        {footer ? (
          <div className="mt-8 border-t border-white/70 pt-6 text-sm text-slate-500">
            {footer}
          </div>
        ) : null}
      </AppCard>
    </div>
  );
};

export default AuthFormShell;
