import { ArrowRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage, requestPasswordReset } from '../service/authAPI.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetTokenPreview, setResetTokenPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    setResetTokenPreview('');

    try {
      const response = await requestPasswordReset(email.trim());
      setSuccessMessage(
        response.message ||
          'Nếu tài khoản tồn tại, liên kết khôi phục đã được gửi.',
      );
      setResetTokenPreview(response.resetToken || '');
      toast.success('Đã gửi yêu cầu khôi phục.');
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Không thể bắt đầu luồng khôi phục. Vui lòng thử lại.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Khôi phục mật khẩu
        </h2>
        <p className="mt-3 text-base text-slate-500">
          Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <div className="flex justify-end">
          <Link
            to="/login"
            className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
          >
            Quay lại Đăng nhập
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-600">
            <div className="space-y-3">
              <p>{successMessage}</p>
              {resetTokenPreview && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-100/50 px-3 py-3 text-xs font-bold text-slate-700">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                    Mã khôi phục
                  </p>
                  <p className="break-all">{resetTokenPreview}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          disabled={isSubmitting}
          className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>

        {resetTokenPreview && (
          <button
            type="button"
            onClick={() => navigate(`/reset-password?token=${resetTokenPreview}`)}
            className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-white py-4 text-base font-extrabold text-brand-700 shadow-sm transition-all hover:-translate-y-1 hover:bg-brand-50"
          >
            Tiếp tục đặt lại mật khẩu
          </button>
        )}
      </form>
    </>
  );
};

export default ForgotPassword;
