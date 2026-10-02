import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";
import { en } from "../locales/en";
import { hi } from "../locales/hi";
import {
  formatKeyAsReadableFallback,
  resolveKeyInDict,
} from "../utils/i18n";

const LanguageContext = createContext(null);
const LANG_KEY = "annapoorna_ui_lang";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "hi") {
      setLanguageState(stored);
    }

    apiClient
      .get("/users/me")
      .then((user) => {
        const prefLang = user?.preferences?.ui_language || user?.preferred_language;
        if (prefLang === "hi" || prefLang === "en") {
          setLanguageState(prefLang);
          localStorage.setItem(LANG_KEY, prefLang);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = async (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem(LANG_KEY, newLang);

    try {
      await apiClient.put("/users/me", {
        preferred_language: newLang,
        preferences: { ui_language: newLang },
      });
    } catch {
      // Local state persists regardless
    }
  };

  /**
   * Safe translation lookup.
   * If key is found in current language dict -> returns translated text.
   * If missing and language is Hindi -> falls back to English dictionary.
   * If still missing:
   *   - If fallback string is provided, returns fallback.
   *   - Otherwise generates clean human-readable title and logs dev warning.
   *   - NEVER returns raw technical key strings (e.g. "crop.doctortitle").
   */
  const t = (key, fallback = "") => {
    if (!key) return fallback || "";

    const dict = language === "hi" ? hi : en;
    let val = resolveKeyInDict(dict, key);
    if (val !== undefined) return val;

    // Fall back to English dictionary if key missing in current language
    if (language !== "en") {
      val = resolveKeyInDict(en, key);
      if (val !== undefined) return val;
    }

    // Missing key handling
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Missing translation: "${key}"`);
    }

    if (fallback && typeof fallback === "string" && fallback.trim() !== "") {
      return fallback;
    }

    return formatKeyAsReadableFallback(key);
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
    return {
      language: "en",
      setLanguage: async () => {},
      t: (key, fallback = "") => {
        const val = resolveKeyInDict(en, key);
        if (val !== undefined) return val;
        return fallback || formatKeyAsReadableFallback(key);
      },
    };
  }
  return ctx;
}

export default LanguageContext;
