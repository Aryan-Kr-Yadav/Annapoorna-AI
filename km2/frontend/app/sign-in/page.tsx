"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || "Could not sign in. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-primary-800">
          <Sprout className="h-6 w-6" />
          <span className="text-lg font-semibold">KrishiMitra AI</span>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4">
          <h1 className="text-lg font-semibold text-primary-900">Log in</h1>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={submitting} className="btn-primary w-full">{submitting ? "Signing in..." : "Log in"}</button>
          <p className="text-center text-sm text-primary-600">
            Don&apos;t have an account? <Link href="/sign-up" className="font-medium text-primary-800 underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
