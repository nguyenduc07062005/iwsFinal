import { NavLink } from 'react-router-dom';
import { AppBadge, AppCard } from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';

const sections = [
  {
    title: 'Core Routes',
    items: [
      {
        to: '/app',
        label: 'Workspace',
        description: 'Folders, documents, search, and uploads.',
        end: true,
      },
      {
        to: '/app/favorites',
        label: 'Favorites',
        description: 'Pinned material for quick retrieval.',
      },
      {
        to: '/profile',
        label: 'Profile',
        description: 'Identity, session state, and logout.',
      },
    ],
  },
];

const SidebarWrapper = () => {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[7.75rem] space-y-6">
        <AppCard className="overflow-hidden" padding="md" tone="glass">
          <AppBadge variant="soft">Shell Navigation</AppBadge>
          <h2 className="mt-4 font-display text-[1.85rem] font-black tracking-tight text-slate-900">
            Route map locked for StudyVault.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            This shell stays stable while the inner features continue to evolve by
            phase. The navigation already maps to the final product structure.
          </p>
        </AppCard>

        {sections.map((section) => (
          <AppCard key={section.title} padding="md" tone="glass">
            <AppBadge size="sm" variant="outline">
              {section.title}
            </AppBadge>

            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-[1.5rem] px-4 py-4 transition-all duration-300',
                      isActive
                        ? 'bg-white text-slate-900 shadow-[var(--shadow-soft)]'
                        : 'text-slate-600 hover:bg-white/70 hover:text-brand-600',
                    )
                  }
                >
                  <p className="text-sm font-black uppercase tracking-[0.14em]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </NavLink>
              ))}
            </div>
          </AppCard>
        ))}

        <AppCard tone="brand" padding="md">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-brand-100">
            Detail Layout
          </p>
          <p className="mt-3 text-sm leading-7 text-brand-100">
            When a document opens, the app switches into a focused reading context
            under `/app/documents/:id` without breaking the authenticated shell.
          </p>
        </AppCard>
      </div>
    </aside>
  );
};

export default SidebarWrapper;
