import { createContext, useContext, useState, useCallback, useMemo } from "react";

const LanguageContext = createContext(null);

const TRANSLATIONS = {
  en: {
    nav_home: "Home",
    nav_diagnose: "Diagnose",
    nav_schemes: "Schemes",
    nav_about: "About",
    hero_headline: "Empowering Farmers with AI",
    hero_subheadline:
      "Detect crop diseases, discover treatments, and access government support instantly.",
    cta_diagnose: "Diagnose Crop",
    cta_learn_more: "Learn More",
  },
  hi: {
    nav_home: "होम",
    nav_diagnose: "जांच करें",
    nav_schemes: "योजनाएं",
    nav_about: "हमारे बारे में",
    hero_headline: "AI के साथ किसानों को सशक्त बनाना",
    hero_subheadline:
      "फसल रोगों की पहचान करें, उपचार जानें, और सरकारी सहायता तुरंत प्राप्त करें।",
    cta_diagnose: "फसल की जांच करें",
    cta_learn_more: "और जानें",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("km_language") || "en");

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem("km_language", lang);
  }, []);

  const t = useCallback(
    (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key,
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage: changeLanguage, t }),
    [language, changeLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
