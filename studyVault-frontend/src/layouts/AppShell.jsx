import { Outlet } from 'react-router-dom';
import ShellHeader from '../components/navigation/ShellHeader.jsx';

const AppShell = () => {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f9e8f6_0%,#f5edff_42%,#f7f3ff_100%)] text-slate-900">
      {/* Dynamic Background - Professional & Subtle */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.72),transparent_42%)]" />
        <div className="absolute right-[-10%] top-[-10%] h-[620px] w-[620px] rounded-full bg-brand-100/45 blur-[130px] animate-pulse" />
        <div className="absolute left-[-8%] top-[26%] h-[560px] w-[560px] rounded-full bg-white/45 blur-[120px] animate-float" />
      </div>

      <ShellHeader />

      {/* Main Content Area */}
      <div className="relative z-10 w-full px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </main>
  );
};

export default AppShell;
