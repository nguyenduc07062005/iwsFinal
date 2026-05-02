import { ArrowRight, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage, submitPasswordReset } from "../service/authAPI.js";
import { cn } from "../lib/utils.js";
import {
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from "../utils/passwordPolicy.js";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenState = useMemo(() => {
    if (!token) {
      return "Missing reset token in the URL. Please request a new reset link.";
    }

    return "";
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (!token) {
      setError("Missing reset token. Please request a new link.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitPasswordReset(token, password);
      setPassword("");
      setConfirmPassword("");
      navigate("/login", {
        replace: true,
        state: {
          notice: {
            message: "Password reset successfully.",
            tone: "success",
          },
        },
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Password could not be reset. Please request a new link and try again.",
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
          Reset password
        </h2>
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-500">
          Create a strong new password for your account.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {!token && (
          <div
            className={cn(
              "mb-6 rounded-xl border p-4 text-sm font-medium",
              "border-red-200 bg-red-50 text-red-600",
            )}
          >
            {tokenState}
          </div>
        )}

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Lock size={20} />
          </div>
          <input
            type="password"
            placeholder="12+ chars with number and symbol"
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
            placeholder="Confirm new password"
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
            Request a new reset link?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button
          disabled={isSubmitting || !token}
          className="group mt-2 flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
        >
          {isSubmitting ? "Updating..." : "Confirm reset"}
          <ArrowRight
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>

      </form>
    </>
  );
};

export default ResetPassword;
