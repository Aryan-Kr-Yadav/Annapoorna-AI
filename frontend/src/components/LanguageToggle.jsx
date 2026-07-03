import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label="Toggle language"
    >
      <Languages size={16} />
      {language === "en" ? "हिंदी" : "EN"}
    </button>
  );
}
