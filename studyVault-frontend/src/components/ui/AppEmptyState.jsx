import { AppCard } from '@/components/ui/AppCard.jsx';

export function AppEmptyState({ action, description, icon, title }) {
  return (
    <AppCard
      className="flex min-h-72 flex-col items-center justify-center text-center"
      padding="lg"
      tone="glass"
    >
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-brand-100 bg-brand-50 text-brand-900 shadow-[var(--shadow-soft)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </AppCard>
  );
}
