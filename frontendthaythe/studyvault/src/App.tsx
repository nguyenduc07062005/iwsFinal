import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WorkspacePage from './pages/WorkspacePage';
import FavoritesPage from './pages/FavoritesPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import AppShell from './layouts/AppShell';
import DetailLayout from './layouts/DetailLayout';
import WorkspaceHeader from './components/common/WorkspaceHeader';
import WorkspaceSidebar from './components/common/WorkspaceSidebar';
import DetailSidebar from './components/common/DetailSidebar';

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
                <LoginPage />
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
                <RegisterPage />
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
                <ForgotPasswordPage />
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
                <ResetPasswordPage />
              </AuthLayout>
            }
          />
          <Route
            path="/app"
            element={
              <AppShell header={<WorkspaceHeader />} sidebar={<WorkspaceSidebar />}>
                <WorkspacePage />
              </AppShell>
            }
          />
          <Route
            path="/app/favorites"
            element={
              <AppShell header={<WorkspaceHeader />} sidebar={<WorkspaceSidebar />}>
                <FavoritesPage />
              </AppShell>
            }
          />
          <Route
            path="/app/documents/:documentId"
            element={
              <DetailLayout header={<WorkspaceHeader />} sidebar={<DetailSidebar />}>
                <div className="glass rounded-[2rem] border border-white/60 p-5 shadow-sm sm:p-6">
                  <DocumentDetailPage />
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
