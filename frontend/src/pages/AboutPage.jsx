import { motion } from "framer-motion";
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Code2,
  Trophy,
  Sprout,
} from "lucide-react";

const TEAM = [
  { name: "Aryan Kumar Yadav", role: "Founder & Developer" },
];

const TECH_STACK = [
  "React", "Vite", "Tailwind CSS", "Framer Motion",
  "Node.js", "Express.js", "Multer",
  "Google Gemini API", "Vercel", "Render",
];

export default function AboutPage() {
  return (
    <div className="container-app py-12 sm:py-16">
      {/* Mission */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Target size={14} /> Our Mission
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Putting expert agricultural knowledge in every farmer's pocket
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          KrishiMitra AI exists to close the gap between Indian farmers and the
          expert guidance, treatments, and government support they deserve —
          using AI as a force for genuine good.
        </p>
      </section>

      {/* Problem Statement */}
      <section className="mx-auto mt-20 grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <AlertTriangle size={14} /> The Problem
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">
            Millions of farmers lose crops to diseases that go undiagnosed for too long
          </h2>
          <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
            Agricultural extension officers are stretched thin, especially in rural
            India. By the time a farmer gets expert advice, crop damage can already
            be severe. Many also remain unaware of government schemes that could
            offset their losses or fund better practices.
          </p>
        </div>
        <div className="card">
          <ul className="space-y-4">
            {[
              "Limited access to agricultural experts in rural areas",
              "Delayed diagnosis leads to greater crop loss",
              "Low awareness of eligible government schemes",
              "Language and literacy barriers to digital tools",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Impact */}
      <section className="mx-auto mt-20 max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <TrendingUp size={14} /> Our Impact Goal
          </span>
          <h2 className="mt-4 section-heading">Designed to scale to millions of farmers</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { stat: "< 30s", label: "From photo to diagnosis" },
            { stat: "2 languages", label: "Hindi & English, more planned" },
            { stat: "100% free", label: "No cost barrier for farmers" },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -4 }}
              className="card text-center"
            >
              <p className="font-display text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {item.stat}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-5xl text-center">
        <h2 className="section-heading">The Team</h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Built by Aryan Kumar Yadav with a focus on practical agricultural support.
        </p>
        <div className="mt-10 flex justify-center">
          {TEAM.map((member) => (
            <div key={member.name} className="card w-full max-w-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 font-display text-lg font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <p className="mt-3 font-semibold text-gray-900 dark:text-white">{member.name}</p>
              <p className="text-xs text-gray-400">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto mt-20 max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Code2 size={14} /> Technology Stack
        </span>
        <h2 className="mt-4 section-heading">Built with</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <div className="card flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <Trophy size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
            Built for farmers and real field conditions
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            KrishiMitra AI was created to support farmers with accessible,
            trustworthy, and free technology for crop diagnosis and scheme discovery.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Sprout size={16} /> Built for practical agricultural support
          </div>
        </div>
      </section>
    </div>
  );
}
