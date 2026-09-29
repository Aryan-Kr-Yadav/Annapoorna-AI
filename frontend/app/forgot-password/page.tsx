"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth/client";

type Step = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      await (authClient as any).forgetPassword.emailOtp({ email });
      setStep("otp");
    } catch {
      // Still advance to OTP step to avoid leaking whether the email exists
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
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
      setError("Please enter the OTP sent to your email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await (authClient as any).emailOtp.resetPassword({
        email,
        otp: otp.trim(),
        password,
      });
      if (res?.error) {
        throw new Error(res.error.message || "Invalid or expired OTP.");
      }
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The OTP may be invalid or expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-primary-800">
          <Sprout className="h-6 w-6" />
          <span className="text-lg font-semibold">Annapoorna AI</span>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-primary-900">
            <Link href="/sign-in" className="rounded-md p-1 text-primary-500 hover:bg-primary-50 hover:text-primary-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-semibold">Reset Password</h1>
          </div>

          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-primary-600">
                Enter your registered email address. We&apos;ll send a one-time verification code to reset your password.
              </p>

              <div>
                <label className="label">Email address</label>
                <input
                  required
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

              <button disabled={submitting} className="btn-primary w-full">
                {submitting ? "Sending..." : "Send Verification Code"}
              </button>

              <p className="text-center text-xs text-primary-500">
                Remember your password?{" "}
                <Link href="/sign-in" className="font-medium text-primary-800 underline">
                  Log in
                </Link>
              </p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-lg bg-primary-50 p-3 text-xs text-primary-700 border border-primary-200">
                <div className="flex items-center gap-1.5 font-semibold text-primary-900 mb-1">
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
                  className="input text-center text-lg tracking-widest"
                  placeholder="••••••"
                  maxLength={10}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-primary-500">At least 8 characters.</p>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

              <button disabled={submitting} className="btn-primary w-full">
                {submitting ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); }}
                className="w-full text-center text-xs text-primary-500 hover:text-primary-800 underline"
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
              <p className="text-sm font-medium text-primary-900">Password Updated Successfully!</p>
              <p className="text-xs text-primary-600">You can now sign in with your new password.</p>
              <Link href="/sign-in" className="btn-primary inline-block w-full text-center">
                Log in Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
