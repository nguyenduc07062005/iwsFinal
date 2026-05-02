import { ArrowRight, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, postRegister } from '../service/authAPI.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please enter your name and email.');
      return;
    }

    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      setError('Invalid email address.');
      return;
    }

    const currentSignature = `${formData.name.trim()}|${formData.email.trim().toLowerCase()}`;

    if (currentSignature === lastSubmittedSignature) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await postRegister({
        email: formData.email.trim(),
        name: formData.name.trim(),
      });

      setSuccessMessage(
        response.message ||
        'Please check your email to verify your account and set a password.',
      );
      setLastSubmittedSignature(currentSignature);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Registration failed. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSignature = `${formData.name.trim()}|${formData.email.trim().toLowerCase()}`;
  const hasSubmittedCurrentInfo =
    Boolean(lastSubmittedSignature) && currentSignature === lastSubmittedSignature;

  return (
    <>
      <div className="mb-7">
        <h2 className="text-4xl font-black leading-[1.08] tracking-normal text-slate-950 sm:text-5xl">
          Create a new account
        </h2>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <User size={20} />
          </div>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Mail size={20} />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Your email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        <button
          disabled={isSubmitting || hasSubmittedCurrentInfo}
          className="group mt-1 flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting
            ? 'Sending email...'
            : hasSubmittedCurrentInfo
              ? 'Verification email sent'
              : 'Send verification email'}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-medium text-slate-500">
        Already have an account?
        <Link
          to="/login"
          className="ml-2 font-bold text-brand-600 underline transition-colors hover:text-brand-800"
        >
          Sign in now
        </Link>
      </p>
    </>
  );
};

export default Register;
