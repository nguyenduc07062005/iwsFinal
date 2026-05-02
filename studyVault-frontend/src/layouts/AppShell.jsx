import { Outlet } from 'react-router-dom';
import ShellHeader from '../components/navigation/ShellHeader.jsx';

const AppShell = () => {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#edf2f7_52%,#fff4f1_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[length:48px_48px]" />
      </div>

      <ShellHeader />

      <div className="relative z-10 w-full px-4 pb-24 pt-24 sm:px-6 md:pb-8 lg:px-8">
        <Outlet />
      </div>
    </main>
  );
};

export default AppShell;
