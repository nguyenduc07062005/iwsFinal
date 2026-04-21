import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpenText,
  FolderClosed,
  Heart,
  LogOut,
  Search,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Library from './pages/Library';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
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

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
} as const;

function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-base-50)] text-[var(--color-dark)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(226,114,91,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(184,115,51,0.10),transparent_18%)]" />
      <div className="relative min-h-screen">{children}</div>
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            {...fadeSlide}
            className="glass hidden rounded-[2rem] border border-white/60 p-8 shadow-sm lg:flex lg:flex-col lg:justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-brand-500" />
                StudyVault Foundation
              </div>
              <h1 className="mt-6 max-w-md text-4xl font-extrabold tracking-tight text-slate-800">
                Premium frontend foundation for the final IWS project.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-500">
                Từ Phase 1, toàn bộ frontend sẽ được dựng lại theo một design system
                thống nhất để đảm bảo tính chuyên nghiệp, đồng bộ và dễ mở rộng cho
                các phase sau.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-5 shadow-sm">
                <p className="text-sm font-bold text-slate-800">UI System</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Bento grid, glassmorphism, premium typography, state feedback rõ ràng.
                </p>
              </div>
              <div className="rounded-3xl bg-brand-900 p-5 text-white shadow-sm">
                <p className="text-sm font-bold">Phase Direction</p>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  Ưu tiên auth, CRUD, sorting, pagination, filtering và summary.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeSlide} className="w-full">
            {children}
          </motion.div>
        </div>
      </div>
    </AppFrame>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame>
      <header className="sticky top-0 z-30 border-b border-white/50 bg-[rgba(250,249,246,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="glass rounded-[2rem] border border-white/60 p-4 shadow-sm lg:p-5">
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
        </aside>

        <main>{children}</main>
      </div>
    </AppFrame>
  );
}

function DetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="glass rounded-[2rem] border border-white/60 p-5 shadow-sm sm:p-6">
          {children}
        </div>
        <div className="glass rounded-[2rem] border border-white/60 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Summary Panel Placeholder
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800">
            Phase 1 foundation
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            Summary panel thật sẽ được triển khai ở phase riêng. Giai đoạn này ưu tiên
            dựng shell, spacing, layout và visual language chuẩn theo rule.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout>
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/app"
            element={
              <AppShell>
                <Library title="Workspace" />
              </AppShell>
            }
          />
          <Route
            path="/app/favorites"
            element={
              <AppShell>
                <Library title="Tài liệu Yêu thích" defaultFilter="favorites" />
              </AppShell>
            }
          />
          <Route
            path="/app/documents/:documentId"
            element={
              <DetailLayout>
                <Library title="Chi tiết tài liệu" />
              </DetailLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppShell>
                <Profile />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
