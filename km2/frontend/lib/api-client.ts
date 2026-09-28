"use client";

/**
 * Centralized API client. Every request goes through here so that
 * base URL, auth header, and error handling stay in one place instead
 * of being duplicated across every page/component.
 *
 * Usage inside a client component:
 *   const { getToken } = useAuth();
 *   const api = useApiClient(getToken);
 *   const farms = await api.get<Farm[]>("/farms");
 */
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type GetToken = () => Promise<string | null>;

async function request<T>(
  getToken: GetToken,
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Token missing/expired/invalid — redirect to sign-in
      window.location.href = "/sign-in";
    }
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  }

  return (json?.data ?? json) as T;
}

export function useApiClient(getToken: GetToken) {
  return useMemo(
    () => ({
      get: <T,>(path: string) => request<T>(getToken, "GET", path),
      post: <T,>(path: string, body?: unknown, isFormData = false) =>
        request<T>(getToken, "POST", path, body, isFormData),
      put: <T,>(path: string, body?: unknown) => request<T>(getToken, "PUT", path, body),
      patch: <T,>(path: string, body?: unknown) => request<T>(getToken, "PATCH", path, body),
      delete: <T,>(path: string) => request<T>(getToken, "DELETE", path),
    }),
    [getToken]
  );
}

/** Convenience hook: `const api = useApi();` inside any client component under AuthProvider. */
export function useApi() {
  const { getToken } = useAuth();
  return useApiClient(getToken);
}
