import { motion } from "framer-motion";

export default function FeatureCard({ icon: Icon, title, description, accent = "emerald" }) {
  const accentStyles = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    sunset: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="card h-full hover:shadow-card-hover"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentStyles[accent]}`}>
        <Icon size={22} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </motion.div>
  );
}
