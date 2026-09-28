"use client";

/**
 * Minimal client-side cookie helpers. We deliberately use a plain
 * (non-httpOnly) cookie rather than localStorage so that `middleware.ts`
 * can also see whether the visitor is signed in and gate protected
 * routes at the edge, without a round trip to the backend.
 *
 * Trade-off, by design: because this cookie is readable by JavaScript,
 * it does not protect against token theft via XSS any better than
 * localStorage would. If you need that extra protection, move token
 * storage into an httpOnly cookie set by a Next.js Route Handler that
 * proxies requests to the backend (a small "BFF" layer) instead of
 * calling the FastAPI backend directly from the browser as this app
 * does. That's a bigger architectural change than swapping Clerk for
 * JWT, so it's left as a follow-up rather than done here.
 */
const COOKIE_NAME = "km_token";

export function getTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setTokenCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const TOKEN_COOKIE_NAME = COOKIE_NAME;
