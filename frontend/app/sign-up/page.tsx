"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, fullName || undefined);
    } catch (e: any) {
      setError(e.message || "Could not create your account. Please try again.");
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
          <h1 className="text-lg font-semibold text-primary-900">Create your account</h1>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label">Name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input required type="password" minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1 text-xs text-primary-500">At least 8 characters.</p>
          </div>
          <button disabled={submitting} className="btn-primary w-full">{submitting ? "Creating account..." : "Sign up"}</button>
          <p className="text-center text-sm text-primary-600">
            Already have an account? <Link href="/sign-in" className="font-medium text-primary-800 underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
