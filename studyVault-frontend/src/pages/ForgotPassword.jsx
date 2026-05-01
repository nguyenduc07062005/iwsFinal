import { ArrowRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage, requestPasswordReset } from '../service/authAPI.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Invalid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await requestPasswordReset(email.trim());
      setSuccessMessage(
        response.message ||
          'Please check your email to reset your password.',
      );
      toast.success('Please check your email to reset your password.');
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Password recovery could not be started. Please check the email and try again.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-black leading-[1.08] tracking-normal text-slate-950 sm:text-5xl">
          Recover password
        </h2>
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-500">
          Enter your email and we will send you a password reset link.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <div className="flex justify-end">
          <Link
            to="/login"
            className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
          >
            Back to sign in
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
          disabled={isSubmitting}
          className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </>
  );
};

export default ForgotPassword;
