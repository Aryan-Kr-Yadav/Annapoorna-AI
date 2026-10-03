import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sprout, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { SidePlantIllustration } from "../components/illustrations/SidePlantIllustration";

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Could not sign in. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      {/* Top Bar Brand Link */}
      <header className="mx-auto w-full max-w-6xl flex items-center justify-between pb-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white shadow-2xs dark:bg-primary-600 transition group-hover:scale-105">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-[var(--foreground)] tracking-tight">
            Annapoorna AI
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          <span>← {t("auth.back_to_home", "Back to Home")}</span>
        </Link>
      </header>

      {/* Main Content Area: Left Plant + Center Auth Card + Right Plant */}
      <main className="my-auto mx-auto w-full max-w-6xl flex items-center justify-center relative">
        {/* Left Decorative Plant (Visible on lg screens) */}
        <div className="hidden lg:flex w-44 xl:w-56 items-end justify-center pr-4">
          <SidePlantIllustration variant="left" />
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-md z-10">
          <div className="card p-6 sm:p-9 shadow-md border border-[var(--border)] bg-[var(--surface)] rounded-2xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 shadow-2xs border border-primary-200/60 dark:border-primary-900/60 mb-3">
                <Sprout className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                {t("auth.welcome_back", "Welcome back")}
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] max-w-xs mx-auto leading-relaxed">
                {t("auth.login_subtitle", "Sign in to continue growing with Annapoorna AI.")}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t("auth.email", "Email Address")}</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.enter_email", "farmer@example.com")}
                    className="input pl-9"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">{t("auth.password", "Password")}</label>
                  <Link
                    to="/forgot-password"
                    className="text-2xs font-semibold text-primary-700 hover:underline dark:text-primary-400"
                  >
                    {t("auth.forgot_password", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-9 pr-9"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-xs sm:text-sm mt-1 shadow-sm"
              >
                <span>{submitting ? t("auth.signing_in", "Signing in...") : t("auth.login", "Login")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--foreground-muted)]">
              {t("auth.no_account", "Don't have an account?")}{" "}
              <Link to="/signup" className="font-bold text-primary-700 hover:underline dark:text-primary-400">
                {t("auth.signup", "Create Account")}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Decorative Plant (Visible on lg screens) */}
        <div className="hidden lg:flex w-44 xl:w-56 items-end justify-center pl-4">
          <SidePlantIllustration variant="right" />
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl text-center pt-6 text-2xs text-[var(--foreground-muted)]">
        © {new Date().getFullYear()} Annapoorna AI. Context-Aware Farm Intelligence.
      </footer>
    </div>
  );
}
