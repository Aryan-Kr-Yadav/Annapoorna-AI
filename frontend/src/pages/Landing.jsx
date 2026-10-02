import React from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  CloudRain,
  Brain,
  CalendarCheck,
  TrendingUp,
  FileText,
  Droplets,
  Tractor,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Eye,
  LineChart,
} from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { useAuth } from "../contexts/AuthContext";
import { HeroPlantIllustration } from "../components/illustrations/HeroPlantIllustration";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary-200 dark:selection:bg-primary-900/60 transition-colors">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Messaging Content */}
            <div className="space-y-6 lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/90 px-3.5 py-1 text-2xs font-extrabold uppercase tracking-widest text-primary-900 dark:border-primary-900/70 dark:bg-primary-950/60 dark:text-primary-300 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                <span>ANNAPOORNA AI</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.12]">
                Farm intelligence that grows with your farm.
              </h1>

              <p className="text-sm sm:text-base md:text-lg leading-relaxed text-[var(--foreground-muted)] max-w-2xl mx-auto lg:mx-0">
                From sowing to harvest, Annapoorna understands your crops, weather, irrigation, farm activity and farm history to help you make better farming decisions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-sm py-2.5 px-6 shadow-sm">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-primary text-sm py-2.5 px-6 shadow-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/login" className="btn-secondary text-sm py-2.5 px-5">
                      <span>Log In</span>
                    </Link>
                  </>
                )}
                <a href="#lifecycle" className="btn-outline text-sm py-2.5 px-4 text-xs font-semibold">
                  <span>Explore Platform</span>
                </a>
              </div>

              {/* Under-CTA brand line */}
              <p className="text-2xs font-bold uppercase tracking-wider text-primary-700/80 dark:text-primary-400/80 pt-1">
                Understand • Decide • Grow
              </p>

              {/* Trust signals / Key points */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-2xs text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Multimodal Leaf Pathology
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Local Weather & APMC Mandi Rates
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Hindi & English Native
                </span>
              </div>
            </div>

            {/* Right: Animated Growing Plant Illustration */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full max-w-[340px] sm:max-w-[420px] px-2 py-4">
                <HeroPlantIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The Connected Farm Lifecycle */}
      <section id="lifecycle" className="border-y border-[var(--border)] bg-[var(--surface)] py-16 sm:py-20 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-primary-800 bg-primary-100 dark:bg-primary-950/50 dark:text-primary-300">
              Connected Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              One Unified System Across the Entire Season
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
              Farming is not an isolated series of events. Annapoorna links every stage of crop production so insights from soil tests and past harvests guide your next planting decisions.
            </p>
          </div>

          {/* Lifecycle Steps Horizontal Connected Flow */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                step: "01",
                stage: "PLAN",
                title: "Crop Planner",
                desc: "Soil & climate matching, seasonal rotation, yield targets.",
                icon: Layers,
              },
              {
                step: "02",
                stage: "GROW",
                title: "Field Operations",
                desc: "Task schedules, soil tests, smart irrigation tracking.",
                icon: Droplets,
              },
              {
                step: "03",
                stage: "PROTECT",
                title: "Crop Doctor",
                desc: "Multimodal leaf diagnosis, weather risk, spraying windows.",
                icon: ShieldCheck,
              },
              {
                step: "04",
                stage: "DECIDE",
                title: "AI Assistant",
                desc: "Context-aware reasoning with complete farm memory.",
                icon: Brain,
              },
              {
                step: "05",
                stage: "HARVEST",
                title: "Harvest & Sales",
                desc: "Output logging, mandi rates, revenue & sales ledgers.",
                icon: TrendingUp,
              },
              {
                step: "06",
                stage: "UNDERSTAND",
                title: "Season Diary",
                desc: "Full timeline archive, cost breakdown, net profit margin.",
                icon: FileText,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.stage}
                  className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 p-4 transition hover:border-primary-400 hover:shadow-xs dark:hover:border-primary-800"
                >
                  <div className="flex items-center justify-between text-2xs font-extrabold text-primary-700 dark:text-primary-400">
                    <span>{item.step}</span>
                    <span className="rounded-md bg-white dark:bg-[#16241a] px-1.5 py-0.5 border border-[var(--border)]">
                      {item.stage}
                    </span>
                  </div>
                  <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-bold text-[var(--foreground)]">{item.title}</h3>
                  <p className="mt-1 text-2xs text-[var(--foreground-muted)] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Feature Story (Alternating Deep Capabilities) */}
      <section id="features" className="py-20 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Capability 1: Farm Memory */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-6">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              Institutional Farm Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Continuous Farm Memory Across Every Season
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--foreground-muted)]">
              Most farming apps treat every session like your first day. Annapoorna permanently records soil nutrient grades, irrigation volumes, past pest outbreaks, fertilizer dosages, and financial outcomes for every plot of land you own.
            </p>
            <ul className="space-y-2.5 text-xs text-[var(--foreground-muted)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Multi-farm parcel and sub-field boundary management</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Historical soil health telemetry (N-P-K, pH, Organic Carbon)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Complete input logs (seed varieties, fertilizers, labor, expenses)</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="card space-y-3 p-5 shadow-sm">
              <div className="text-xs font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                Chronological Field Memory
              </div>
              <div className="space-y-2 text-2xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-secondary)]">
                  <span className="font-semibold">Soil Test (ICAR Benchmark)</span>
                  <span className="text-emerald-700 font-bold">Nitrogen: Low • Phosphorus: Medium</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-secondary)]">
                  <span className="font-semibold">Irrigation (3,200 Litres)</span>
                  <span className="text-sky-700 font-bold">4 days ago • Tube Well</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-secondary)]">
                  <span className="font-semibold">Fertilizer Application</span>
                  <span className="text-amber-700 font-bold">DAP 50kg/acre at sowing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capability 2: Annapoorna Assistant */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="card space-y-3 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary-600" />
                  <span className="text-xs font-bold text-[var(--foreground)]">Assistant Consultation</span>
                </div>
                <span className="badge-primary">GPT-OSS 120B • Grounded</span>
              </div>
              <div className="space-y-2 text-2xs">
                <div className="p-2.5 rounded-lg bg-primary-600 text-white font-medium max-w-[85%] ml-auto">
                  Should I apply zinc sulfate to my wheat crop this week?
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] max-w-[90%] space-y-1.5">
                  <p className="font-bold text-primary-900 dark:text-primary-300">
                    Recommendation: Yes, apply zinc sulfate foliar spray.
                  </p>
                  <p className="text-[var(--foreground-muted)]">
                    <strong>Why:</strong> Your field soil test recorded 0.52 mg/kg available zinc (below the 0.60 critical threshold), and wheat at tillering has peak micronutrient demand.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-6 order-1 lg:order-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              Agronomic Reasoning
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Annapoorna Assistant with Real Farm Tools
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--foreground-muted)]">
              Unlike generic AI chatbots that guess, Annapoorna uses verified agronomic tools. It queries your active crop cycle, recent irrigation logs, local weather forecast, and mandi rates before crafting each recommendation.
            </p>
            <ul className="space-y-2.5 text-xs text-[var(--foreground-muted)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero hallucinated chemical dosages or fake metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Understands voice queries in both Hindi and English</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Concise, practical, farmer-first action steps</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Capability 3: Crop Doctor AI */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-6">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              Visual Disease & Pest Identification
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Crop Doctor AI Powered by Multimodal Vision
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--foreground-muted)]">
              Snap a photo of discolored leaves, wilting stems, or pest damage. Our dedicated vision intelligence identifies the pathogen, estimates severity, and provides immediate cultural and biological remedies.
            </p>
            <ul className="space-y-2.5 text-xs text-[var(--foreground-muted)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant visual diagnosis for cereal, legume, oilseed & horticultural crops</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Categorized into Severity, Causes, Immediate Action & Prevention</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Alerts when local Krishi Vigyan Kendra (KVK) intervention is needed</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="card space-y-3 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-[var(--foreground)]">Diagnosis Sample</span>
                </div>
                <span className="text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                  Moderate Severity
                </span>
              </div>
              <div className="space-y-2 text-2xs">
                <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)]">
                  <div className="font-bold text-[var(--foreground)]">Yellow Rust (Puccinia striiformis)</div>
                  <p className="text-[var(--foreground-muted)] mt-0.5">
                    Linear yellow pustules along leaf veins. Favored by cool temperatures (10-15°C) and high morning humidity.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-primary-200 bg-primary-50/50 dark:border-primary-900/40 dark:bg-primary-950/20">
                  <span className="font-bold text-primary-900 dark:text-primary-300">Immediate Action:</span>
                  <p className="text-[var(--foreground-muted)] mt-0.5">
                    Spray approved triazole fungicide class as per local agricultural university advisory. Avoid excess nitrogen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: "Why Annapoorna" (Comparison) */}
      <section id="why-annapoorna" className="border-t border-[var(--border)] bg-[var(--surface)] py-20 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              The Critical Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Why Annapoorna AI Outperforms Generic Chatbots
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
              Farming requires location, time, crop stage, and environmental awareness. An isolated LLM cannot know your field's soil moisture. Annapoorna unifies all 8 agronomic dimensions.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Generic Chatbot */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <XCircle className="h-5 w-5 text-rose-600" />
                <span>Generic Farming Chatbot</span>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-[var(--foreground-muted)]">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Answers in total isolation without knowing your plot or soil</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Has no memory of when you last irrigated or sprayed</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Outputs textbook paragraphs rather than actionable today tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Blind to your local weather telemetry and mandi prices</span>
                </li>
              </ul>
            </div>

            {/* Annapoorna AI */}
            <div className="rounded-2xl border border-primary-300 bg-primary-50/60 p-6 dark:border-primary-800 dark:bg-primary-950/30 shadow-sm">
              <div className="flex items-center gap-2 text-primary-900 dark:text-primary-200 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span>Annapoorna Farm Intelligence</span>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-[var(--foreground)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Connects:</strong> Farm + Crop + Stage + Soil + Weather + Health + Tasks + History</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Proactively reminds you before rain or heat stress affects your field</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Keeps an exact season-by-season ledger of yield and profit margins</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Grounded in ICAR agronomic rules and local government schemes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Landing Page CTA */}
      <section className="py-20 border-t border-[var(--border)] bg-[var(--surface-secondary)]/60 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300 shadow-sm">
            <Sprout className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            Ready to understand your farm better?
          </h2>

          <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-xl mx-auto leading-relaxed">
            Join thousands of farmers streamlining land, crop cycles, soil nutrients, and financial margins with Annapoorna AI.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm py-3 px-8 shadow-sm">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary text-sm py-3 px-8 shadow-sm">
                  <span>Create Your Farm</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="btn-secondary text-sm py-3 px-6">
                  <span>Already have an account? Log In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-12 text-2xs text-[var(--foreground-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-700 text-white">
              <Sprout className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-[var(--foreground)]">Annapoorna AI</span>
            <span>— Intelligent Agriculture Operating System</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-[var(--foreground)]">Features</a>
            <a href="#lifecycle" className="hover:text-[var(--foreground)]">Lifecycle</a>
            <a href="#why-annapoorna" className="hover:text-[var(--foreground)]">Comparison</a>
            <Link to="/login" className="hover:text-[var(--foreground)]">Log In</Link>
            <Link to="/signup" className="hover:text-[var(--foreground)]">Register</Link>
          </div>

          <div>
            © {new Date().getFullYear()} Annapoorna AI. Built for Indian Agriculture.
          </div>
        </div>
      </footer>
    </div>
  );
}
