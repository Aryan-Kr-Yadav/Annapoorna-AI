import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, ArrowLeft, CheckCircle2, KeyRound, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authClient } from "../api/authClient";
import { SidePlantIllustration } from "../components/illustrations/SidePlantIllustration";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // 'email' | 'otp' | 'done'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      if (authClient?.forgetPassword?.emailOtp) {
        await authClient.forgetPassword.emailOtp({ email });
      }
      setStep("otp");
    } catch {
      // Advance to OTP step to avoid leaking account existence
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setSubmitting(true);
    try {
      if (authClient?.emailOtp?.resetPassword) {
        const res = await authClient.emailOtp.resetPassword({
          email,
          otp: otp.trim(),
          password,
        });
        if (res?.error) {
          throw new Error(res.error.message || "Invalid or expired verification code.");
        }
      }
      setStep("done");
    } catch (err) {
      setError(err?.message || "Failed to reset password. The code may be invalid or expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      {/* Top Bar Brand Link */}
      <header className="mx-auto w-full max-w-6xl flex items-center justify-between pb-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white shadow-2xs dark:bg-primary-600 transition group-hover:scale-105">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-[var(--foreground)] tracking-tight">
            Annapoorna AI
          </span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          <span>← Back to Login</span>
        </Link>
      </header>

      {/* Main Content Area: Left Plant + Center Auth Card + Right Plant */}
      <main className="my-auto mx-auto w-full max-w-6xl flex items-center justify-center relative">
        {/* Left Decorative Plant (Visible on lg screens) */}
        <div className="hidden lg:flex w-44 xl:w-56 items-end justify-center pr-4">
          <SidePlantIllustration variant="left" />
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-md z-10">
          <div className="card p-6 sm:p-9 shadow-md border border-[var(--border)] bg-[var(--surface)] rounded-2xl space-y-6">
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg p-1.5 text-stone-400 hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                  Reset Password
                </h1>
                <p className="text-2xs text-[var(--foreground-muted)]">
                  Recover access to your farm workspace
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
                {error}
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Enter your registered farmer account email address. We'll send an authentication code to reset your password.
                </p>

                <div>
                  <label className="label">Registered Email</label>
                  <div className="relative">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@example.com"
                      className="input pl-9"
                    />
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="btn-primary w-full text-xs sm:text-sm py-2.5 shadow-sm"
                >
                  {submitting ? "Sending OTP..." : "Send Verification Code"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="rounded-lg bg-primary-50 p-3 text-xs text-primary-800 border border-primary-200 dark:bg-primary-950/30 dark:border-primary-900 dark:text-primary-300">
                  <div className="flex items-center gap-1.5 font-semibold text-primary-900 dark:text-primary-100 mb-1">
                    <KeyRound className="h-3.5 w-3.5" />
                    Verification Code Sent
                  </div>
                  If an account exists for <strong>{email}</strong>, a one-time code has been sent to your inbox.
                </div>

                <div>
                  <label className="label">Verification Code (OTP)</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input text-center tracking-widest font-mono"
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-3 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full text-xs sm:text-sm py-2.5 shadow-sm"
                >
                  {submitting ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(null); }}
                  className="w-full text-center text-xs text-primary-700 hover:text-primary-800 underline dark:text-primary-400"
                >
                  Didn&apos;t receive a code? Go back
                </button>
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4 text-center py-2">
                <div className="flex justify-center text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="text-sm font-bold text-[var(--foreground)]">Password Updated Successfully!</p>
                <p className="text-xs text-[var(--foreground-muted)]">You can now sign in with your new password.</p>
                <Link to="/login" className="btn-primary inline-block w-full text-center text-xs py-2.5 shadow-sm">
                  Log in Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Decorative Plant (Visible on lg screens) */}
        <div className="hidden lg:flex w-44 xl:w-56 items-end justify-center pl-4">
          <SidePlantIllustration variant="right" />
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl text-center pt-6 text-2xs text-[var(--foreground-muted)]">
        © {new Date().getFullYear()} Annapoorna AI. Context-Aware Farm Intelligence.
      </footer>
    </div>
  );
}
