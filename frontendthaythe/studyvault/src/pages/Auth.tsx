import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import studyIllustration from '../assets/study_illustration.png';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

type AuthConfig = {
  mode: AuthMode;
  title: string;
  description: string;
  submitLabel: string;
  helperLabel?: string;
  helperActionLabel?: string;
  helperActionTo?: string;
  secondaryLinkLabel?: string;
  secondaryLinkTo?: string;
};

const AUTH_CONTENT: Record<AuthMode, AuthConfig> = {
  login: {
    mode: 'login',
    title: 'Welcome back to StudyVault',
    description:
      'Đăng nhập để truy cập workspace, quản lý tài liệu, và tiếp tục hành trình refactor theo đúng chuẩn đồ án IWS.',
    submitLabel: 'Đăng nhập',
    helperLabel: 'Chưa có tài khoản?',
    helperActionLabel: 'Tạo tài khoản mới',
    helperActionTo: '/register',
    secondaryLinkLabel: 'Quên mật khẩu?',
    secondaryLinkTo: '/forgot-password',
  },
  register: {
    mode: 'register',
    title: 'Create your premium study workspace',
    description:
      'Thiết lập tài khoản mới để bắt đầu quản lý tài liệu, thư mục, tìm kiếm và summary trong một hệ thống đồng bộ.',
    submitLabel: 'Đăng ký',
    helperLabel: 'Đã có tài khoản?',
    helperActionLabel: 'Đăng nhập ngay',
    helperActionTo: '/login',
  },
  forgot: {
    mode: 'forgot',
    title: 'Recover your account securely',
    description:
      'Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu. Phase 3 sẽ gắn API forgot/reset thật vào luồng này.',
    submitLabel: 'Gửi liên kết khôi phục',
    helperLabel: 'Đã nhớ lại mật khẩu?',
    helperActionLabel: 'Quay về đăng nhập',
    helperActionTo: '/login',
  },
  reset: {
    mode: 'reset',
    title: 'Set a new password',
    description:
      'Nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản. Giao diện này đã được dựng sẵn để nối API reset password ở phase sau.',
    submitLabel: 'Đặt lại mật khẩu',
    helperLabel: 'Muốn quay lại trang đăng nhập?',
    helperActionLabel: 'Về đăng nhập',
    helperActionTo: '/login',
  },
};

function resolveMode(pathname: string): AuthMode {
  if (pathname.includes('register')) return 'register';
  if (pathname.includes('forgot-password')) return 'forgot';
  if (pathname.includes('reset-password')) return 'reset';
  return 'login';
}

function AuthField({
  icon,
  type,
  placeholder,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-[1.25rem] border border-white/60 bg-white/80 px-4 py-4 pl-12 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-brand-100 focus:bg-white focus:ring-4 focus:ring-brand-100/60"
        />
      </div>
    </label>
  );
}

export default function Auth() {
  const location = useLocation();
  const mode = resolveMode(location.pathname);
  const config = AUTH_CONTENT[mode];

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass overflow-hidden rounded-[2rem] border border-white/60 p-6 shadow-sm sm:p-8"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Trang chủ
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-brand-600">
            <ShieldCheck className="h-4 w-4" />
            Auth Foundation
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
          <div>
            <div className="mb-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-brand-900 text-white shadow-sm">
                <BookOpenText className="h-6 w-6" />
              </div>
              <h1 className="max-w-lg text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
                {config.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                {config.description}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              {mode === 'register' && (
                <AuthField icon={<User className="h-5 w-5" />} type="text" placeholder="Họ và tên" />
              )}

              <AuthField icon={<Mail className="h-5 w-5" />} type="email" placeholder="Email của bạn" />

              {mode !== 'forgot' && (
                <AuthField icon={<Lock className="h-5 w-5" />} type="password" placeholder="Mật khẩu" />
              )}

              {mode === 'reset' && (
                <AuthField
                  icon={<ShieldCheck className="h-5 w-5" />}
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                />
              )}

              {config.secondaryLinkLabel && config.secondaryLinkTo ? (
                <div className="flex justify-end">
                  <Link
                    to={config.secondaryLinkTo}
                    className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-900"
                  >
                    {config.secondaryLinkLabel}
                  </Link>
                </div>
              ) : null}

              <button className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-brand-900/15 transition-all hover:-translate-y-1 hover:bg-brand-600">
                <span>{config.submitLabel}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {config.helperLabel && config.helperActionLabel && config.helperActionTo ? (
              <p className="mt-8 text-center text-sm font-medium text-slate-500">
                {config.helperLabel}{' '}
                <Link
                  to={config.helperActionTo}
                  className="font-bold text-brand-600 transition-colors hover:text-brand-900"
                >
                  {config.helperActionLabel}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="hidden xl:block">
            <div className="rounded-[1.75rem] bg-white/70 p-4 shadow-sm">
              <div className="overflow-hidden rounded-[1.5rem] bg-brand-50/70 p-4">
                <img
                  src={studyIllustration}
                  alt="StudyVault Illustration"
                  className="mx-auto h-48 w-full object-contain"
                />
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-800">Phase 1 Goal</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Khóa visual language và auth shell trước khi nối backend thật.
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-900 p-4 text-white shadow-sm">
                  <p className="text-sm font-bold">Next phases</p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Phase 2 refactor router, Phase 3 nối login/register/forgot/reset password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
