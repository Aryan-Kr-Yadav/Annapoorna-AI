import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import apiClient from "../api/client";

const ThemeContext = createContext(null);
const THEME_KEY = "annapoorna_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  const applyTheme = useCallback(
    (currentTheme) => {
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
    const saved = localStorage.getItem(THEME_KEY);
    const initialTheme = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Sync from user profile preferences if available
    apiClient
      .get("/users/me")
      .then((user) => {
        const userTheme = user?.preferences?.theme;
        if (userTheme === "light" || userTheme === "dark" || userTheme === "system") {
          setThemeState(userTheme);
          localStorage.setItem(THEME_KEY, userTheme);
          applyTheme(userTheme);
        }
      })
      .catch(() => {});

    // Listen to system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const current = localStorage.getItem(THEME_KEY) || "system";
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
  }, [applyTheme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);

    try {
      await apiClient.put("/users/me", {
        preferences: { theme: newTheme },
      });
    } catch {
      // Local state persists regardless
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
      theme: "system",
      resolvedTheme: "light",
      mounted: false,
      setTheme: async () => {},
    };
  }
  return ctx;
}

export default ThemeContext;
