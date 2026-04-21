import type { ReactNode } from 'react';
import { FolderClosed, Heart, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    to: '/app',
    label: 'Workspace',
    icon: <FolderClosed className="h-4 w-4" />,
  },
  {
    to: '/app/favorites',
    label: 'Favorites',
    icon: <Heart className="h-4 w-4" />,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: <UserCircle2 className="h-4 w-4" />,
  },
];

export default function WorkspaceSidebar() {
  return (
    <div className="glass rounded-[2rem] border border-white/60 p-4 shadow-sm lg:p-5">
      <p className="mb-4 px-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
        Navigation
      </p>
      <nav className="flex flex-col gap-2">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm transition-transform group-hover:scale-105">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
