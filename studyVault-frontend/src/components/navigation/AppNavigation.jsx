import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils.js';

const NAV_ITEMS = [
  { to: '/app', label: 'Workspace', end: true },
  { to: '/app/favorites', label: 'Favorites' },
  { to: '/profile', label: 'Profile' },
];

const AppNavigation = ({ className = '' }) => {
  return (
    <nav className={cn('flex items-center gap-2 overflow-x-auto scrollbar-none', className)}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            [
              'inline-flex whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300',
              isActive
                ? 'bg-brand-900 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-600 hover:bg-white/70 hover:text-brand-600 hover:translate-y-[-1px]',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default AppNavigation;
