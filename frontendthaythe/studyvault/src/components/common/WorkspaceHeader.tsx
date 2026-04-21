import { BookOpenText, LogOut, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkspaceHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Link to="/app" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-sm">
          <BookOpenText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold tracking-tight text-slate-800">StudyVault</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            IWS Final
          </p>
        </div>
      </Link>

      <div className="glass hidden min-w-[280px] items-center gap-3 rounded-full px-4 py-2 shadow-sm md:flex">
        <Search className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-400">Search documents, folders, or summaries</span>
      </div>

      <button className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>
  );
}
