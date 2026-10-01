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

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "API_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
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

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch (err: any) {
    // Pure network connectivity or server unreachable error
    throw new ApiError(
      "Backend server is offline or unreachable. Please ensure the backend is running.",
      0,
      "NETWORK_ERROR"
    );
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // No response body or non-JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Token missing/expired/invalid — redirect to sign-in
      window.location.href = "/sign-in";
    }

    // Precise error classification according to HTTP status code
    let detailMsg = json?.message || json?.detail;
    if (typeof detailMsg === "object") {
      detailMsg = JSON.stringify(detailMsg);
    }

    let defaultMsg = `Request failed (${res.status})`;
    let code = "HTTP_ERROR";

    switch (res.status) {
      case 400:
        defaultMsg = "Invalid request. Please check the entered data.";
        code = "BAD_REQUEST";
        break;
      case 401:
        defaultMsg = "Your session has expired. Please sign in again.";
        code = "UNAUTHORIZED";
        break;
      case 403:
        defaultMsg = "Access denied. You do not have permission for this resource.";
        code = "FORBIDDEN";
        break;
      case 404:
        defaultMsg = "The requested resource was not found.";
        code = "NOT_FOUND";
        break;
      case 409:
        defaultMsg = "This record already exists or conflicts with existing data.";
        code = "CONFLICT";
        break;
      case 422:
        defaultMsg = "Validation error: please check your input data.";
        code = "VALIDATION_ERROR";
        break;
      case 429:
        defaultMsg = "AI or server rate limit reached. Please wait a moment.";
        code = "RATE_LIMIT";
        break;
      case 500:
      case 502:
        defaultMsg = "Internal server error. Please try again later.";
        code = "SERVER_ERROR";
        break;
      case 503:
        defaultMsg = "Backend service is temporarily unavailable.";
        code = "SERVICE_UNAVAILABLE";
        break;
    }

    throw new ApiError(detailMsg || defaultMsg, res.status, code);
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
