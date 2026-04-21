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
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import AppShell from './layouts/AppShell';
import DetailLayout from './layouts/DetailLayout';

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

function AuthAside() {
  return (
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
  );
}

function WorkspaceHeader() {
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

function WorkspaceSidebar() {
  return (
    <div className="glass rounded-[2rem] border border-white/60 p-4 shadow-sm lg:p-5">
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
    </div>
  );
}

function DetailSidebar() {
  return (
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
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...fadeSlide}>
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
              <AuthLayout
                title="Đăng nhập tài khoản"
                description="Tiếp tục vào workspace tài liệu với trải nghiệm thống nhất, hiện đại và dễ bảo vệ trong dự án cuối kỳ."
                aside={<AuthAside />}
              >
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout
                title="Tạo tài khoản mới"
                description="Đăng ký nhanh để bắt đầu quản lý thư mục, tài liệu và các tính năng học tập cốt lõi của hệ thống."
                aside={<AuthAside />}
              >
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout
                title="Khôi phục mật khẩu"
                description="Nhập email để bắt đầu quy trình đặt lại mật khẩu đúng chuẩn yêu cầu môn học và luồng xác thực hoàn chỉnh."
                aside={<AuthAside />}
              >
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout
                title="Đặt lại mật khẩu"
                description="Hoàn tất bước xác thực cuối cùng để quay lại workspace một cách an toàn và liền mạch."
                aside={<AuthAside />}
              >
                <Auth />
              </AuthLayout>
            }
          />
          <Route
            path="/app"
            element={
              <AppShell header={<WorkspaceHeader />} sidebar={<WorkspaceSidebar />}>
                <Library title="Workspace" />
              </AppShell>
            }
          />
          <Route
            path="/app/favorites"
            element={
              <AppShell header={<WorkspaceHeader />} sidebar={<WorkspaceSidebar />}>
                <Library title="Tài liệu Yêu thích" defaultFilter="favorites" />
              </AppShell>
            }
          />
          <Route
            path="/app/documents/:documentId"
            element={
              <DetailLayout header={<WorkspaceHeader />} sidebar={<DetailSidebar />}>
                <div className="glass rounded-[2rem] border border-white/60 p-5 shadow-sm sm:p-6">
                  <Library title="Chi tiết tài liệu" />
                </div>
              </DetailLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppShell header={<WorkspaceHeader />} sidebar={<WorkspaceSidebar />}>
                <Profile />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
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
