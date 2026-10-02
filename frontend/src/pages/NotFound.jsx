import React from "react";
import { Link } from "react-router-dom";
import { Sprout, Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">404</h1>
      <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
        Agricultural Pathway Not Found
      </h2>
      <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        The requested field, record, or navigation route does not exist or has been relocated.
      </p>

      <div className="mt-6">
        <Link to="/dashboard" className="btn-primary text-xs">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Return to Farm Dashboard
        </Link>
      </div>
    </div>
  );
}
