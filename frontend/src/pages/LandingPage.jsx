import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScanLine,
  Languages,
  Landmark,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Camera,
  MessageSquareText,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import FeatureCard from "../components/FeatureCard.jsx";
import TestimonialCard from "../components/TestimonialCard.jsx";
import FAQItem from "../components/FAQItem.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Instant Disease Detection",
    description: "Snap a photo of your crop and get an AI-powered diagnosis in seconds.",
    accent: "emerald",
  },
  {
    icon: MessageSquareText,
    title: "Symptom-Based Diagnosis",
    description: "No camera handy? Just describe what you see and get the same expert insight.",
    accent: "amber",
  },
  {
    icon: ShieldCheck,
    title: "Safe Treatment Plans",
    description: "Organic and chemical treatment options, reviewed for safety and clarity.",
    accent: "emerald",
  },
  {
    icon: Landmark,
    title: "Government Schemes",
    description: "Discover subsidies and support programs relevant to your state and crop.",
    accent: "sunset",
  },
  {
    icon: Languages,
    title: "Hindi & English",
    description: "Use KrishiMitra fully in Hindi or English — whichever feels like home.",
    accent: "amber",
  },
  {
    icon: Smartphone,
    title: "Built for Mobile",
    description: "A simple, fast, low-data interface designed for everyday smartphone use.",
    accent: "emerald",
  },
];

const STEPS = [
  {
    icon: Camera,
    title: "Capture or Describe",
    description: "Take a photo of the affected crop, or simply describe the symptoms you've noticed.",
  },
  {
    icon: Sparkles,
    title: "AI Analyzes",
    description: "Our AI agent examines the image or text using agricultural expertise built into Gemini.",
  },
  {
    icon: ClipboardList,
    title: "Get Your Action Plan",
    description: "Receive a clear diagnosis, treatment plan, prevention tips, and relevant schemes.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I found leaf curl on my tomatoes and got treatment advice in two minutes — saved my harvest.",
    name: "Ramesh Patil",
    location: "Nashik, Maharashtra",
    crop: "Tomato",
  },
  {
    quote: "The Hindi support means my father can use it himself without needing me to translate.",
    name: "Sunita Devi",
    location: "Muzaffarpur, Bihar",
    crop: "Rice",
  },
  {
    quote: "I didn't know I was eligible for three different schemes until KrishiMitra showed me.",
    name: "Gurpreet Singh",
    location: "Ludhiana, Punjab",
    crop: "Wheat",
  },
];

const FAQS = [
  {
    question: "Is KrishiMitra AI free to use?",
    answer: "Yes, KrishiMitra AI is completely free for farmers and focused on making agricultural support more accessible.",
  },
  {
    question: "How accurate is the disease diagnosis?",
    answer: "Our AI provides a confidence score with every diagnosis. While it's a powerful first opinion, we always recommend consulting a local agricultural expert for confirmation, especially for high-severity cases.",
  },
  {
    question: "Do I need internet access to use this?",
    answer: "Yes, KrishiMitra AI needs an internet connection to analyze images and symptoms using AI. We've optimized the app to work well even on slower mobile connections.",
  },
  {
    question: "What crops are supported?",
    answer: "We currently focus on Wheat, Rice, Tomato, Potato, Cotton, and Sugarcane, with a general-purpose mode for other crops too.",
  },
  {
    question: "Is my data kept private?",
    answer: "Images and symptom descriptions are only used to generate your diagnosis and are not shared with third parties beyond the AI provider needed to process your request.",
  },
];

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-gray-950 dark:to-gray-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-900/20" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20" />

        <div className="container-app relative grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Sparkles size={14} /> AI-Powered Farming Companion
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              {t("hero_headline")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              {t("hero_subheadline")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/diagnose" className="btn-primary">
                <ScanLine size={18} /> {t("cta_diagnose")}
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                {t("cta_learn_more")} <ArrowRight size={18} />
              </a>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">2</p>
                Languages supported
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">6+</p>
                Crops covered
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">24/7</p>
                AI availability
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="animate-float rounded-3xl border border-emerald-100 bg-white p-6 shadow-card-hover dark:border-emerald-900/40 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-400">Diagnosis Result</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Medium Severity
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-gray-900 dark:text-white">
                Early Blight (Tomato)
              </h3>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              </div>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">87% confidence</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p>🌿 Organic: Neem oil spray every 5–7 days</p>
                <p>🧪 Chemical: Copper-based fungicide</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 shadow-card-hover dark:bg-gray-900 sm:block">
              <p className="text-xs font-semibold text-gray-400">Govt. Scheme Match</p>
              <p className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-400">PM-KISAN ✓ Eligible</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container-app py-20" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">Everything a farmer needs, in one place</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Built to be simple, trustworthy, and genuinely useful — not just another app.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900/40" id="how-it-works">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">How It Works</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Three simple steps to a healthier harvest.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-card">
                  <step.icon size={26} />
                </div>
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-app py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">Why farmers trust KrishiMitra AI</h2>
            <ul className="mt-6 space-y-4">
              {[
                "Get a second opinion before spending on treatments.",
                "Avoid crop loss with early, accurate disease detection.",
                "Save time finding government schemes you actually qualify for.",
                "Use it confidently in your own language.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    ✓
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{b}</span>
                </li>
              ))}
            </ul>
            <Link to="/diagnose" className="btn-primary mt-8 inline-flex">
              Try It Now <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card flex flex-col items-center justify-center py-10 text-center">
              <p className="font-display text-3xl font-bold text-emerald-700 dark:text-emerald-400">90%+</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Avg. diagnosis confidence</p>
            </div>
            <div className="card flex flex-col items-center justify-center py-10 text-center">
              <p className="font-display text-3xl font-bold text-amber-600">&lt; 30s</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Average response time</p>
            </div>
            <div className="card flex flex-col items-center justify-center py-10 text-center">
              <p className="font-display text-3xl font-bold text-emerald-700 dark:text-emerald-400">2</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Languages: Hindi &amp; English</p>
            </div>
            <div className="card flex flex-col items-center justify-center py-10 text-center">
              <p className="font-display text-3xl font-bold text-amber-600">Free</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Always, for every farmer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900/40">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">Trusted by farmers like you</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-app py-20" id="faq">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">Frequently Asked Questions</h2>
        </div>
        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {FAQS.map((f) => (
            <FAQItem key={f.question} {...f} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-app pb-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-8 py-16 text-center shadow-card-hover sm:px-16">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to protect your harvest?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100">
            Diagnose your first crop issue in under a minute — completely free.
          </p>
          <Link to="/diagnose" className="btn-amber mt-8 inline-flex">
            <ScanLine size={18} /> {t("cta_diagnose")}
          </Link>
        </div>
      </section>
    </div>
  );
}
