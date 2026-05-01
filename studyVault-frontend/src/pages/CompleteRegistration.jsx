import { ArrowRight, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  completeRegistration,
  getApiErrorMessage,
} from "../service/authAPI.js";
import { setAuthNotice } from "../utils/auth.js";
import {
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from "../utils/passwordPolicy.js";

const CompleteRegistration = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(token ? "ready" : "missing-token");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteRegistration = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus("missing-token");
      setMessage("Missing verification link. Please request a new email.");
      return;
    }

    if (!password || !confirmPassword) {
      setStatus("ready");
      setMessage("Please enter and confirm your password.");
      return;
    }

    if (!isStrongPassword(password)) {
      setStatus("ready");
      setMessage(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setStatus("ready");
      setMessage("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await completeRegistration(token, password);
      const successMessage =
        response.message || "Your account has been activated successfully.";
      setStatus("success");
      setMessage(successMessage);
      setPassword("");
      setConfirmPassword("");
      setAuthNotice({
        message:
          "Your account has been activated. You can sign in to StudyVault now.",
        tone: "success",
      });
      toast.success("Your account has been activated.");
    } catch (requestError) {
      setStatus("error");
      setMessage(
        getApiErrorMessage(
          requestError,
          "The verification link is invalid or has expired.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = status === "success";
  const isError = status === "error" || status === "missing-token";

  return (
    <>
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {isSuccess ? (
            <CheckCircle2 size={24} />
          ) : isError ? (
            <ShieldAlert size={24} />
          ) : (
            <Lock size={24} />
          )}
        </div>
        <h2 className="text-4xl font-black leading-[1.08] tracking-normal text-slate-950 sm:text-5xl">
          Set password
        </h2>
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-500">
          Enter a password to verify your email link and activate your account.
        </p>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-xl border p-4 text-sm font-medium ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : isError
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {message}
        </div>
      )}

      {isSuccess && (
        <Link
          to="/login"
          className="group flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600"
        >
          Sign in
          <ArrowRight
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}

      {!isSuccess && token && (
        <form className="space-y-4" onSubmit={handleCompleteRegistration}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="12+ chars with number and symbol"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            disabled={isSubmitting}
            className="group flex w-full transform items-center justify-center gap-2 rounded-2xl bg-brand-900 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1 hover:bg-brand-600 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-brand-900"
          >
            {isSubmitting ? "Activating..." : "Activate account"}
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </form>
      )}

      {!isSuccess && (
        <Link
          to="/register"
          className="mt-5 flex justify-center text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
        >
          Resend verification email
        </Link>
      )}
    </>
  );
};

export default CompleteRegistration;
