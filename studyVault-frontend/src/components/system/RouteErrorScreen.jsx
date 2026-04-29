import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { AppButton, AppCard } from '@/components/ui/index.js';

const RouteErrorScreen = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? error.statusText || 'This route is unavailable right now.'
    : error?.message || 'The requested route could not be rendered.';

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <AppCard className="w-full max-w-2xl text-center" padding="lg" tone="glass">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-brand-600">
          Route Error
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
          This page could not be opened.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <AppButton
            type="button"
            size="lg"
            onClick={() => navigate(0)}
            trailingIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reload Route
          </AppButton>
          <AppButton
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => navigate('/')}
            trailingIcon={<Home className="h-4 w-4" />}
          >
            Go Home
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
};

export default RouteErrorScreen;
