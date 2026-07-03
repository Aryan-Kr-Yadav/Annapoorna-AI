import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2, FileText, Gift } from "lucide-react";

export default function SchemeCard({ scheme, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {scheme.schemeName}
        </h3>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Active
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {scheme.description}
      </p>

      {scheme.eligibility?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <CheckCircle2 size={14} /> Eligibility
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {scheme.eligibility.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-500">•</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheme.benefits?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Gift size={14} /> Benefits
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {scheme.benefits.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-500">•</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheme.requiredDocuments?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <FileText size={14} /> Required Documents
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scheme.requiredDocuments.map((doc, i) => (
              <span key={i} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {scheme.applicationProcess && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-200">How to apply: </span>
          {scheme.applicationProcess}
        </p>
      )}

      {scheme.officialWebsite && (
        <a
          href={scheme.officialWebsite}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Visit official website <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
}
