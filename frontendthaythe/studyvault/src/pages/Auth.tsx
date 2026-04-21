import React, { useMemo, useState } from 'react';
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
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import AppFieldError from '../components/ui/AppFieldError';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

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

type AuthFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

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

function createInitialValues(): AuthFormValues {
  return {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(mode: AuthMode, values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  if (mode === 'register' && !values.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.';
  }

  if (!values.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!validateEmail(values.email.trim())) {
    errors.email = 'Email chưa đúng định dạng.';
  }

  if (mode !== 'forgot' && !values.password.trim()) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (mode !== 'forgot' && values.password.trim().length < 6) {
    errors.password = 'Mật khẩu cần tối thiểu 6 ký tự.';
  }

  if (mode === 'reset' && !values.confirmPassword.trim()) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (
    mode === 'reset' &&
    values.confirmPassword.trim() &&
    values.confirmPassword !== values.password
  ) {
    errors.confirmPassword = 'Xác nhận mật khẩu chưa khớp.';
  }

  return errors;
}

interface AuthProps {
  mode?: AuthMode;
}

export default function Auth({ mode: modeProp }: AuthProps) {
  const location = useLocation();
  const mode = modeProp ?? resolveMode(location.pathname);
  const config = AUTH_CONTENT[mode];
  const [values, setValues] = useState<AuthFormValues>(createInitialValues());
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const successMessage = useMemo(() => {
    if (!isSubmitted) return '';

    if (mode === 'forgot') {
      return 'Đã sẵn sàng nối API gửi liên kết khôi phục ở Phase 3. Giao diện và validation phía client đã được chuẩn hóa.';
    }

    if (mode === 'reset') {
      return 'Luồng đặt lại mật khẩu đã sẵn sàng để nối backend reset password trong Phase 3.';
    }

    if (mode === 'register') {
      return 'Form đăng ký đã sẵn sàng để nối API register và xử lý phản hồi từ backend.';
    }

    return 'Form đăng nhập đã sẵn sàng để nối API login trong Phase 3.';
  }, [isSubmitted, mode]);

  const updateField = (field: keyof AuthFormValues, nextValue: string) => {
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setIsSubmitted(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(mode, values);
    setErrors(nextErrors);
    setIsSubmitted(Object.keys(nextErrors).length === 0);
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden"
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'register' ? (
                <AppInput
                  name="fullName"
                  label="Họ và tên"
                  placeholder="Nhập họ và tên"
                  value={values.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  leftIcon={<User className="h-5 w-5" />}
                  error={errors.fullName}
                />
              ) : null}

              <AppInput
                name="email"
                type="email"
                label="Email"
                placeholder="Email của bạn"
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
                leftIcon={<Mail className="h-5 w-5" />}
                error={errors.email}
              />

              {mode !== 'forgot' ? (
                <AppInput
                  name="password"
                  type="password"
                  label={mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}
                  placeholder={mode === 'reset' ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'}
                  value={values.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  leftIcon={<Lock className="h-5 w-5" />}
                  error={errors.password}
                />
              ) : null}

              {mode === 'reset' ? (
                <AppInput
                  name="confirmPassword"
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  value={values.confirmPassword}
                  onChange={(event) =>
                    updateField('confirmPassword', event.target.value)
                  }
                  leftIcon={<ShieldCheck className="h-5 w-5" />}
                  error={errors.confirmPassword}
                />
              ) : null}

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

              <AppButton
                type="submit"
                fullWidth
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                className="group"
              >
                {config.submitLabel}
              </AppButton>
            </form>

            <AppFieldError
              className="mt-4"
              message={
                isSubmitted
                  ? successMessage
                  : undefined
              }
            />

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
                  <p className="text-sm font-bold text-slate-800">Phase 2 Goal</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Auth UI dùng shared components, page structure rõ ràng, sẵn sàng nối API thật.
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-900 p-4 text-white shadow-sm">
                  <p className="text-sm font-bold">Next phases</p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Phase 3 sẽ nối login/register/forgot/reset password với backend và protected route logic.
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
