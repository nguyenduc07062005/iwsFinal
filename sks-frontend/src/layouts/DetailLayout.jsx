import { Outlet, useNavigate } from 'react-router-dom';
import ShellHeader from '../components/navigation/ShellHeader.jsx';

const DetailLayout = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--color-base-50)]">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute left-[-8rem] top-[12rem] h-[24rem] w-[24rem] rounded-full bg-[color:rgba(226,114,91,0.12)] blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[color:rgba(184,115,51,0.12)] blur-3xl" />
      </div>

      <ShellHeader />

      <div className="mx-auto flex min-h-[calc(100vh-6.25rem)] w-full max-w-[1560px] flex-col px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-[2rem] bg-white/75 px-5 py-4 shadow-sm backdrop-blur-xl border border-white/70">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
              Document detail
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              Preview, summary, and related context
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-brand-600"
          >
            Back to workspace
          </button>
        </div>

        <div className="glass min-h-0 flex-1 overflow-hidden rounded-[2rem]">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default DetailLayout;
