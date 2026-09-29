"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";

type Language = "en" | "hi";

interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const DICTIONARY: TranslationDictionary = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "nav.farms": { en: "My Farms", hi: "मेरे खेत" },
  "nav.assistant": { en: "Annapoorna AI", hi: "अन्नपूर्णा AI" },
  "nav.crop_doctor": { en: "Crop Doctor", hi: "क्रॉप डॉक्टर" },
  "nav.weather": { en: "Weather", hi: "मौसम" },
  "nav.schemes": { en: "Schemes", hi: "सरकारी योजनाएं" },
  "nav.market": { en: "Market", hi: "मंडी भाव" },
  "nav.analytics": { en: "Analytics", hi: "विश्लेषण" },
  "nav.crop_planner": { en: "Crop Planner", hi: "फसल योजना" },
  "nav.settings": { en: "Settings", hi: "सेटिंग्स" },
  "nav.logout": { en: "Log out", hi: "लॉग आउट" },

  // Context & Selectors
  "context.select_farm": { en: "Select Farm", hi: "खेत चुनें" },
  "context.select_crop": { en: "Select Crop", hi: "फसल चुनें" },
  "context.active_farm": { en: "Active Farm", hi: "सक्रिय खेत" },
  "context.active_crop": { en: "Active Crop", hi: "सक्रिय फसल" },
  "context.general_mode": { en: "General Mode", hi: "सामान्य मोड" },
  "context.using": { en: "Using", hi: "सक्रिय" },

  // Common UI
  "common.save": { en: "Save", hi: "सहेजें" },
  "common.saving": { en: "Saving...", hi: "सहेजा जा रहा है..." },
  "common.saved": { en: "Saved.", hi: "सहेजा गया।" },
  "common.cancel": { en: "Cancel", hi: "रद्द करें" },
  "common.delete": { en: "Delete", hi: "हटाएं" },
  "common.close": { en: "Close", hi: "बंद करें" },
  "common.view_details": { en: "View Details", hi: "विवरण देखें" },
  "common.all": { en: "All", hi: "सभी" },
  "common.low": { en: "Low", hi: "कम" },
  "common.medium": { en: "Moderate", hi: "मध्यम" },
  "common.high": { en: "High", hi: "उच्च" },

  // Dashboard
  "dash.active_crops": { en: "Active Crops", hi: "सक्रिय फसलें" },
  "dash.todays_tasks": { en: "Today's Tasks", hi: "आज के कार्य" },
  "dash.irrigation": { en: "Irrigation", hi: "सिंचाई" },
  "dash.weather_intel": { en: "Weather Intelligence", hi: "मौसम विश्लेषण" },
  "dash.season_expenses": { en: "Season Expenses", hi: "सीजन खर्च" },
  "dash.recent_inspections": { en: "Recent Health Inspections", hi: "हालिया फसल निरीक्षण" },

  // Settings
  "settings.title": { en: "Settings", hi: "सेटिंग्स" },
  "settings.general": { en: "General", hi: "सामान्य" },
  "settings.farm_prefs": { en: "Farm Preferences", hi: "खेत प्राथमिकताएं" },
  "settings.ai_assistant": { en: "AI Assistant", hi: "AI सहायक" },
  "settings.notifications": { en: "Notifications", hi: "सूचनाएं" },
  "settings.account": { en: "Account & Security", hi: "खाता और सुरक्षा" },
};

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
    const entry = DICTIONARY[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || entry?.en || key;
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
