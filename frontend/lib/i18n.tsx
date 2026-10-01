"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";

import enDict from "@/locales/en.json";
import hiDict from "@/locales/hi.json";

type Language = "en" | "hi";

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return typeof curr === "string" ? curr : undefined;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Initial load: first from localStorage, then verify from backend profile
    const stored = (typeof window !== "undefined" ? window.localStorage.getItem("annapoorna_ui_lang") : null) as Language | null;
    if (stored === "en" || stored === "hi") {
      setLanguageState(stored);
    }

    api
      .get<any>("/users/me")
      .then((user) => {
        const prefLang = user?.preferences?.ui_language || user?.preferred_language;
        if (prefLang === "hi" || prefLang === "en") {
          setLanguageState(prefLang);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("annapoorna_ui_lang", prefLang);
          }
        }
      })
      .catch(() => {
        // Fallback to local state if offline or unauthenticated
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("annapoorna_ui_lang", newLang);
    }
    try {
      await api.put("/users/me", {
        preferred_language: newLang,
        preferences: { ui_language: newLang },
      });
    } catch {
      // Local change still persists in localStorage
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = language === "hi" ? hiDict : enDict;
    const val = getNestedValue(dict, key);
    if (val !== undefined) return val;
    if (language !== "en") {
      const enVal = getNestedValue(enDict, key);
      if (enVal !== undefined) return enVal;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      language: "en" as Language,
      setLanguage: async () => {},
      t: (key: string, fallback?: string) => fallback || key,
    };
  }
  return ctx;
}
