import { Outlet } from 'react-router-dom';
import ShellHeader from '../components/navigation/ShellHeader.jsx';

const DetailLayout = () => {
  return (
    <main className="min-h-dvh overflow-x-hidden text-slate-900 xl:h-screen xl:overflow-hidden">
      <div className="workspace-aurora pointer-events-none inset-0 -z-10" />

      <ShellHeader />

      <div className="mx-auto flex min-h-dvh w-full max-w-[1840px] flex-col px-2 pb-24 pt-[5.25rem] sm:px-3 lg:px-4 lg:pb-4 xl:h-screen xl:min-h-0 xl:pb-2">
        <Outlet />
      </div>
    </main>
  );
};

export default DetailLayout;
