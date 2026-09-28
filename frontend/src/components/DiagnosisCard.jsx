import { motion } from "framer-motion";
import {
  AlertCircle,
  Leaf,
  ShieldCheck,
  FlaskConical,
  Sprout,
  ListChecks,
  UserCheck,
  Info,
} from "lucide-react";
import { SEVERITY_STYLES } from "../utils/constants.js";

function Section({ icon: Icon, title, children, accent = "text-emerald-600 dark:text-emerald-400" }) {
  return (
    <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
      <h4 className={`flex items-center gap-2 font-display text-base font-semibold ${accent}`}>
        <Icon size={18} /> {title}
      </h4>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <p className="text-sm text-gray-400">Not specified.</p>;
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function DiagnosisCard({ diagnosis }) {
  const severity = SEVERITY_STYLES[diagnosis.severity] || SEVERITY_STYLES.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {diagnosis.isHealthy && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Leaf size={12} /> Looks Healthy
            </span>
          )}
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {diagnosis.diseaseName}
          </h2>
        </div>
        <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${severity.badge}`}>
          {diagnosis.severity} Severity
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${diagnosis.confidencePercentage || 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {diagnosis.confidencePercentage}% confidence
        </span>
      </div>

      {diagnosis.limitations && (
        <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <Info size={16} className="mt-0.5 shrink-0" />
          {diagnosis.limitations}
        </div>
      )}

      <div className="mt-2 space-y-5">
        <Section icon={AlertCircle} title="Symptoms">
          <BulletList items={diagnosis.symptoms} />
        </Section>

        <Section icon={Sprout} title="Organic Treatment" accent="text-emerald-600 dark:text-emerald-400">
          <BulletList items={diagnosis.treatment?.organic} />
        </Section>

        <Section icon={FlaskConical} title="Chemical Treatment" accent="text-orange-600 dark:text-orange-400">
          <BulletList items={diagnosis.treatment?.chemical} />
        </Section>

        <Section icon={ShieldCheck} title="Preventive Measures">
          <BulletList items={diagnosis.preventiveMeasures} />
        </Section>

        <Section icon={ListChecks} title="Immediate Next Steps">
          <BulletList items={diagnosis.immediateNextSteps} />
        </Section>

        <Section icon={UserCheck} title="When to Consult an Expert" accent="text-red-600 dark:text-red-400">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {diagnosis.consultExpertIf || "If symptoms worsen or persist, consult a local expert."}
          </p>
        </Section>
      </div>
    </motion.div>
  );
}
