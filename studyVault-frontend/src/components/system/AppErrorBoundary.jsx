import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Component } from 'react';
import { AppButton, AppCard } from '@/components/ui/index.js';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudyVault UI crashed', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleBackToHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <AppCard
          className="w-full max-w-2xl text-center"
          padding="lg"
          tone="glass"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-brand-600">
            Interface Recovery
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Something broke in this screen.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
            The app caught the error before the interface fully crashed. Reload
            the current page or return to the StudyVault workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <AppButton
              type="button"
              size="lg"
              onClick={this.handleReload}
              trailingIcon={<RefreshCcw className="h-4 w-4" />}
            >
              Reload Page
            </AppButton>
            <AppButton
              type="button"
              size="lg"
              variant="secondary"
              onClick={this.handleBackToHome}
            >
              Back To Home
            </AppButton>
          </div>
        </AppCard>
      </div>
    );
  }
}

export default AppErrorBoundary;
