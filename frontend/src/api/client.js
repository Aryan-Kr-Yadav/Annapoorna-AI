/**
 * Central API Client for Annapoorna AI Frontend.
 * Handles environment-based URL, JWT Authorization injection,
 * and standard HTTP error classification.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(message, status = 0, code = "API_ERROR", detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

// Global token getter function, registered by AuthContext
let tokenProvider = () => null;
let unauthorizedHandler = () => {};

export function setTokenProvider(fn) {
  tokenProvider = fn;
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export async function request(method, path, body = undefined, isFormData = false) {
  const token = await Promise.resolve(tokenProvider());
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Backend server is offline or unreachable. Please verify network connection or server status.",
      0,
      "NETWORK_ERROR"
    );
  }

  let json = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      unauthorizedHandler();
    }

    let detailMsg = json?.message || json?.detail;
    if (typeof detailMsg === "object" && detailMsg !== null) {
      detailMsg = JSON.stringify(detailMsg);
    }

    let defaultMsg = `Request failed with status ${res.status}`;
    let code = "HTTP_ERROR";

    switch (res.status) {
      case 400:
        defaultMsg = "Bad request. Please verify entered information.";
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
        defaultMsg = "This item conflicts with an existing record.";
        code = "CONFLICT";
        break;
      case 422:
        defaultMsg = "Validation error: please check required fields.";
        code = "VALIDATION_ERROR";
        break;
      case 429:
        defaultMsg = "AI or request rate limit reached. Please wait a moment.";
        code = "RATE_LIMIT";
        break;
      case 500:
      case 502:
        defaultMsg = "Internal server error. Please try again later.";
        code = "SERVER_ERROR";
        break;
      case 503:
        defaultMsg = "Service temporarily unavailable.";
        code = "SERVICE_UNAVAILABLE";
        break;
    }

    throw new ApiError(detailMsg || defaultMsg, res.status, code, json);
  }

  return json?.data !== undefined ? json.data : json;
}

export const apiClient = {
  get: (path) => request("GET", path),
  post: (path, body, isFormData = false) => request("POST", path, body, isFormData),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default apiClient;
