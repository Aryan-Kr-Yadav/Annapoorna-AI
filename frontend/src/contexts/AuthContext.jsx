import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setTokenProvider, setUnauthorizedHandler, apiClient } from "../api/client";
import { authClient } from "../api/authClient";

const AuthContext = createContext(null);

const TOKEN_KEY = "annapoorna_access_token";
const TOKEN_EXP_KEY = "annapoorna_token_exp";
const USER_KEY = "annapoorna_cached_user";

let cachedJwtToken = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
})();

let jwtTokenExpiresAt = (() => {
  try {
    return parseInt(localStorage.getItem(TOKEN_EXP_KEY) || "0", 10);
  } catch {
    return 0;
  }
})();

let inFlightSessionPromise = null;

function saveToken(token) {
  cachedJwtToken = token;
  jwtTokenExpiresAt = parseJwtExpiration(token);
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXP_KEY, String(jwtTokenExpiresAt));
  } catch {}
}

function clearToken() {
  cachedJwtToken = null;
  jwtTokenExpiresAt = 0;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

function parseJwtExpiration(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.exp ? parsed.exp * 1000 : Date.now() + 15 * 60 * 1000;
  } catch {
    return Date.now() + 15 * 60 * 1000;
  }
}

export async function getValidAccessToken() {
  if (cachedJwtToken && Date.now() < jwtTokenExpiresAt - 30000) {
    return cachedJwtToken;
  }

  if (inFlightSessionPromise) {
    return inFlightSessionPromise;
  }

  inFlightSessionPromise = (async () => {
    try {
      const sessionRes = await authClient.getSession();
      const token = sessionRes?.data?.session?.token;
      if (token) {
        saveToken(token);
        return token;
      }
    } catch (err) {
      console.warn("Neon Auth session token retrieval notice:", err);
    } finally {
      inFlightSessionPromise = null;
    }
    clearToken();
    return null;
  })();

  return inFlightSessionPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState(null);

  // Load current session and JWT token from Neon Auth
  const loadSession = useCallback(async () => {
    try {
      const sessionRes = await authClient.getSession();
      if (sessionRes?.data?.user) {
        const u = sessionRes.data.user;
        const jwt = sessionRes.data?.session?.token;
        if (jwt) {
          saveToken(jwt);
        }
        const userData = {
          id: u.id,
          email: u.email,
          name: u.name || u.email?.split("@")[0] || "Farmer",
          full_name: u.name || null,
          image: u.image || null,
        };
        setUser(userData);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        } catch {}
        setError(null);
        return true;
      } else {
        setUser(null);
        clearToken();
        return false;
      }
    } catch (err) {
      console.warn("Neon Auth getSession notice:", err);
      if (!cachedJwtToken || Date.now() >= jwtTokenExpiresAt) {
        setUser(null);
        clearToken();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTokenProvider(() => getValidAccessToken());
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
    });
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message || "Invalid email or password.");
      }

      await loadSession();

      // Ping backend to confirm token verification and auto-provision user
      try {
        await apiClient.get("/auth/verify");
      } catch (verifyErr) {
        console.warn("Backend auth/verify notice:", verifyErr);
      }
    } catch (err) {
      const rawMsg = err?.message || "";
      const isInvalid =
        err?.status === 401 ||
        rawMsg.toLowerCase().includes("invalid") ||
        rawMsg.toLowerCase().includes("credential") ||
        err?.code === "invalid_credentials";

      const message = isInvalid
        ? "Invalid email or password."
        : err?.code === "NETWORK_ERROR" || rawMsg.toLowerCase().includes("network")
        ? "Unable to connect to the authentication service."
        : rawMsg || "Unable to sign in right now. Please try again.";

      setError(message);
      throw new Error(message);
    }
  };

  const register = async (email, password, fullName = "") => {
    setError(null);
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: fullName || "",
      });

      if (result?.error) {
        throw new Error(result.error.message || "Could not create your account.");
      }

      await loadSession();

      try {
        await apiClient.get("/auth/verify");
      } catch (verifyErr) {
        console.warn("Backend auth/verify notice:", verifyErr);
      }
    } catch (err) {
      const message = err?.message || "Could not create your account. Please try again.";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn("Neon Auth signOut failed:", err);
    } finally {
      clearToken();
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user, token: cachedJwtToken } : null,
        isAuthenticated: !!user,
        loading,
        isLoading: loading,
        error,
        login,
        register,
        signup: register,
        logout,
        getToken: getValidAccessToken,
        getAccessToken: getValidAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
