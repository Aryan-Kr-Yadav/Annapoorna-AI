"use client";

/**
 * Auth context powered by Neon Auth (Managed Better Auth). Wraps the
 * @neondatabase/auth client and exposes session/user state plus
 * sign-in, sign-up, sign-out helpers to the rest of the app.
 *
 * All authentication flows (email+password, OAuth, etc.) are handled
 * by the Neon Auth service — we never see or store passwords locally.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  full_name?: string | null;
  image: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current session on mount
  const loadSession = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser({
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name ?? null,
          image: session.data.user.image ?? null,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        throw new Error(
          result.error.message || "Incorrect email or password."
        );
      }
      // Reload session to pick up the new user
      await loadSession();
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }

  async function register(
    email: string,
    password: string,
    fullName?: string
  ) {
    setError(null);
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: fullName || "",
      });
      if (result.error) {
        throw new Error(
          result.error.message || "Could not create your account."
        );
      }
      // Reload session to pick up the new user
      await loadSession();
      router.push("/onboarding");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }

  async function logout() {
    await authClient.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  async function getToken(): Promise<string | null> {
    try {
      const res = await fetch("/api/auth/token", { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.token ?? null;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
