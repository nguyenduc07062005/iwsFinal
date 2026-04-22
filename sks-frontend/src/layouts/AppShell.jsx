import { Outlet } from 'react-router-dom';
import { PageContainer } from '@/components/common/index.js';
import ShellHeader from '../components/navigation/ShellHeader.jsx';


const AppShell = () => {
  return (
    <main className="min-h-screen overflow-x-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#faf9fe]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#e2e0ff,transparent)] opacity-40" />
        <div className="absolute right-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-purple-100/50 blur-[120px] animate-pulse" />
        <div className="absolute left-[-5%] top-[20%] h-[500px] w-[500px] rounded-full bg-blue-50/50 blur-[100px] animate-float" />
      </div>

      <ShellHeader />

      <div className="relative z-10 pt-20 pb-24">
        <Outlet />
      </div>
    </main>
  );
};

export default AppShell;
