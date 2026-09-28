import { Link } from "react-router-dom";
import { Sprout, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
        <Sprout size={28} />
      </div>
      <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white">404</h1>
      <p className="max-w-sm text-gray-500 dark:text-gray-400">
        This page seems to have wandered off the field. Let's get you back.
      </p>
      <Link to="/" className="btn-primary">
        <ArrowLeft size={18} /> Back to Home
      </Link>
    </div>
  );
}
