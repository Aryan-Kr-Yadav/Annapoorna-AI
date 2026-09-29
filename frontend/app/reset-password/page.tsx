"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy reset-password route.
 *
 * Neon Auth (Managed Better Auth) uses an email-OTP flow for password
 * resets instead of magic-link tokens. The full flow now lives on
 * /forgot-password.  If a user arrives here (e.g. from a bookmark),
 * redirect them there.
 */
export default function ResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <p className="text-sm text-primary-600">Redirecting to password reset…</p>
    </div>
  );
}
