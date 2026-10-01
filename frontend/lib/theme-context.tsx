"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/api-client";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  mounted: boolean;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  const applyTheme = useCallback(
    (currentTheme: Theme) => {
      if (typeof window === "undefined") return;
      const isDark =
        currentTheme === "dark" || (currentTheme === "system" && getSystemTheme() === "dark");
      setResolvedTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    },
    [getSystemTheme]
  );

  useEffect(() => {
    setMounted(true);

    const saved = (
      typeof window !== "undefined" ? window.localStorage.getItem("annapoorna_theme") : null
    ) as Theme | null;
    const initialTheme: Theme =
      saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Sync from user preferences if available
    api
      .get<any>("/users/me")
      .then((user) => {
        const userTheme = user?.preferences?.theme as Theme | undefined;
        if (
          userTheme &&
          (userTheme === "light" || userTheme === "dark" || userTheme === "system")
        ) {
          setThemeState(userTheme);
          window.localStorage.setItem("annapoorna_theme", userTheme);
          applyTheme(userTheme);
        }
      })
      .catch(() => {});

    // Listen to OS system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const current = (window.localStorage.getItem("annapoorna_theme") || "system") as Theme;
      if (current === "system") {
        const isDark = e.matches;
        setResolvedTheme(isDark ? "dark" : "light");
        if (isDark) {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [api, applyTheme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("annapoorna_theme", newTheme);
    }
    applyTheme(newTheme);

    try {
      await api.put("/users/me", {
        preferences: { theme: newTheme },
      });
    } catch {
      // Local state still applies smoothly
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, mounted, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system" as Theme,
      resolvedTheme: "light" as "light" | "dark",
      mounted: false,
      setTheme: async () => {},
    };
  }
  return ctx;
}
