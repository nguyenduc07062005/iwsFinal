import { ArrowRight, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage, submitPasswordReset } from '../service/authAPI.js';
import { setAuthNotice } from '../utils/auth.js';
import { cn } from '../lib/utils.js';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenState = useMemo(() => {
    if (!token) {
      return 'Thiếu token khôi phục trong URL. Vui lòng yêu cầu liên kết khôi phục mới.';
    }

    return 'Đã phát hiện token hợp lệ. Vui lòng đặt mật khẩu mới.';
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ cả 2 trường mật khẩu.');
      return;
    }

    if (!token) {
      setError('Thiếu token khôi phục. Vui lòng yêu cầu lại.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await submitPasswordReset(token, password);
      setSuccessMessage(response.message || 'Đặt lại mật khẩu thành công.');
      setAuthNotice({
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
        tone: 'success',
      });
      toast.success('Đặt lại mật khẩu thành công.');
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Không thể đặt lại mật khẩu. Vui lòng gửi yêu cầu mới.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Đặt lại mật khẩu
        </h2>
        <p className="mt-3 text-base text-slate-500">
          Tạo một mật khẩu mới mạnh mẽ cho tài khoản của bạn.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div 
          className={cn(
            "rounded-xl border p-4 text-sm font-medium mb-6",
            token ? "border-sky-200 bg-sky-50 text-sky-600" : "border-red-200 bg-red-50 text-red-600"
          )}
        >
          {tokenState}
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Lock size={20} />
          </div>
          <input
            type="password"
            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!token}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50"
          />
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Lock size={20} />
          </div>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!token}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
          >
            Yêu cầu liên kết khôi phục mới?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-600">
            {successMessage}
          </div>
        )}

        <button 
          disabled={isSubmitting || !token}
          className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đặt lại'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>

        {successMessage && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-white py-4 text-base font-extrabold text-brand-700 shadow-sm transition-all hover:-translate-y-1 hover:bg-brand-50"
          >
            Quay lại Đăng nhập
          </button>
        )}
      </form>
    </>
  );
};

export default ResetPassword;
