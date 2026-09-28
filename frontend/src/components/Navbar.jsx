import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Menu, X, ScanLine } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { to: "/", key: "nav_home" },
  { to: "/diagnose", key: "nav_diagnose" },
  { to: "/schemes", key: "nav_schemes" },
  { to: "/about", key: "nav_about" },
];

export default function Navbar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-soft backdrop-blur-md dark:bg-gray-950/90"
          : "bg-white/60 backdrop-blur-sm dark:bg-gray-950/60"
      }`}
    >
      <nav className="container-app flex h-16 items-center justify-between sm:h-20">
        <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-400 sm:text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-card sm:h-10 sm:w-10">
            <Sprout size={20} />
          </span>
          KrishiMitra <span className="hidden text-amber-600 sm:inline">AI</span>
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-emerald-700 dark:text-gray-300 dark:hover:bg-gray-900"
                }`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          <button onClick={() => navigate("/diagnose")} className="btn-primary !px-4 !py-2.5 text-sm">
            <ScanLine size={16} />
            {t("cta_diagnose")}
          </button>
        </div>

        <button
          className="rounded-lg p-2 text-gray-700 dark:text-gray-200 md:hidden"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950 md:hidden"
          >
            <div className="container-app flex flex-col gap-1 py-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-base font-medium ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "text-gray-700 dark:text-gray-200"
                    }`
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center gap-2 px-4">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
