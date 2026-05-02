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
    const storedNotice = consumeAuthNotice();
    const nextNotice = location.state?.notice || storedNotice;

    if (nextNotice) {
      setNotice(nextNotice);
    }
  }, [location.state]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Invalid email address.');
      return;
    }

    setError('');
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await postLogin(email, password);

      if (!response.accessToken) {
        setError('Sign-in failed. The API did not return an access token.');
        return;
      }

      setToken(response.accessToken);
      const storedRedirect = consumeAuthRedirectPath();
      const nextPath =
        location.state?.from?.pathname || storedRedirect || '/app';
      const nextSearch = location.state?.from?.search || '';
      navigate(`${nextPath}${nextSearch}`, { replace: true });
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        'Sign-in failed. Please try again.',
      );

      setError(
        message.includes('verify your email')
          ? 'Email has not been verified or no password has been set. Please check your inbox to finish registration.'
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notice && (
        <div
          role="status"
          className={cn(
            "fixed left-1/2 top-5 z-[100] w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 rounded-2xl border px-5 py-4 text-center text-sm font-extrabold shadow-2xl backdrop-blur-xl",
            notice.tone === 'success'
              ? "border-emerald-200 bg-emerald-50/95 text-emerald-700 shadow-emerald-900/10"
              : "border-brand-200 bg-brand-50/95 text-brand-700 shadow-brand-900/10"
          )}
        >
          {notice.message}
        </div>
      )}

      <div className="mb-7">
        <h2 className="text-4xl font-black leading-[1.08] tracking-normal text-slate-950 sm:text-5xl">
          Welcome back!
        </h2>
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-500">
          Sign in to manage your study workspace.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleLogin}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Mail size={20} />
          </div>
          <input
            type="email"
            placeholder="Your email"
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
            placeholder="Password"
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
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button 
          disabled={isSubmitting}
          className="group flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3.5 mt-1 text-sm font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-slate-500">
        Don't have an account?
        <Link
          to="/register"
          className="ml-2 font-bold text-brand-600 underline transition-colors hover:text-brand-800"
        >
          Create a free account
        </Link>
      </p>
    </>
  );
};

export default Login;
