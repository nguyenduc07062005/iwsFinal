import { Outlet } from 'react-router-dom';
import ShellHeader from '../components/navigation/ShellHeader.jsx';

const DetailLayout = () => {
  return (
    <main className="h-screen overflow-hidden text-slate-900">
      <div className="workspace-aurora pointer-events-none inset-0 -z-10" />

      <ShellHeader />

      <div className="mx-auto flex h-screen w-full max-w-[1840px] flex-col px-2 pb-2 pt-[5.25rem] sm:px-3 lg:px-4">
        <Outlet />
      </div>
    </main>
  );
};

export default DetailLayout;
