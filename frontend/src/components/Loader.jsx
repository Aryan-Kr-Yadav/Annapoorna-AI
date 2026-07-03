import { motion } from "framer-motion";
import { Sprout } from "lucide-react";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
      >
        <Sprout size={26} />
      </motion.div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
