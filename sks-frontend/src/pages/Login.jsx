import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, postLogin } from '../service/authAPI.js';
import {
  consumeAuthNotice,
  consumeAuthRedirectPath,
  setToken,
} from '../utils/auth.js';
import { cn } from '../lib/utils.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextNotice = consumeAuthNotice();

    if (nextNotice) {
      setNotice(nextNotice);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    setError('');
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await postLogin(email, password);

      if (!response.accessToken) {
        setError('Đăng nhập thất bại. API không trả về access token.');
        return;
      }

      setToken(response.accessToken);
      const storedRedirect = consumeAuthRedirectPath();
      const nextPath =
        location.state?.from?.pathname || storedRedirect || '/app';
      const nextSearch = location.state?.from?.search || '';
      navigate(`${nextPath}${nextSearch}`, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Đăng nhập thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Chào mừng trở lại!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Đăng nhập để quản lý tài nguyên học tập của bạn.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleLogin}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Mail size={20} />
          </div>
          <input
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Lock size={20} />
          </div>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {notice && (
          <div
            className={cn(
              "rounded-xl border p-4 text-sm font-medium",
              notice.tone === 'success' 
                ? "border-emerald-200 bg-emerald-50 text-emerald-600" 
                : "border-brand-200 bg-brand-50 text-brand-600"
            )}
          >
            {notice.message}
          </div>
        )}

        <button 
          disabled={isSubmitting}
          className="group flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3.5 mt-1 text-sm font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
          <span className="bg-white px-4 text-slate-400">Hoặc tiếp tục với</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg> 
          Google
        </button>
        <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-slate-500">
        Chưa có tài khoản?
        <Link
          to="/register"
          className="ml-2 font-bold text-brand-600 underline transition-colors hover:text-brand-800"
        >
          Đăng ký miễn phí
        </Link>
      </p>
    </>
  );
};

export default Login;
