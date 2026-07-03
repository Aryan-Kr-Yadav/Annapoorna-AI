import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Landmark } from "lucide-react";
import SchemeCard from "../components/SchemeCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { ResultSkeleton } from "../components/Skeleton.jsx";
import { INDIAN_STATES, CROP_TYPES } from "../utils/constants.js";
import { fetchSchemes } from "../services/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../hooks/useToast.js";

export default function SchemesPage() {
  const [state, setState] = useState("");
  const [crop, setCrop] = useState("");
  const [schemes, setSchemes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const { language, setLanguage } = useLanguage();
  const toast = useToast();

  const handleSearch = async () => {
    if (!state || !crop) {
      toast.error("Please select both a state and a crop.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const result = await fetchSchemes({ state, crop, language });
      setSchemes(result?.schemes || []);
    } catch (err) {
      setError(err.message || "Failed to fetch schemes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Landmark size={14} /> Government Support
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Find Schemes You Qualify For
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Select your state, crop, and language to discover relevant government schemes.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="state" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              State
            </label>
            <select id="state" value={state} onChange={(e) => setState(e.target.value)} className="input-field">
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="crop" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Crop
            </label>
            <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)} className="input-field">
              <option value="">Select crop</option>
              {CROP_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lang" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Language
            </label>
            <select
              id="lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading} className="btn-primary mt-5 w-full">
          <Search size={18} /> {loading ? "Searching..." : "Find Schemes"}
        </button>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ResultSkeleton />
            <ResultSkeleton />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={handleSearch} />}

        {!loading && !error && searched && schemes?.length === 0 && (
          <EmptyState
            icon={Landmark}
            title="No schemes found"
            description="We couldn't find specific schemes for this combination. Try a different crop or check the PM-KISAN portal for general support."
          />
        )}

        {!loading && !error && schemes?.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          >
            {schemes.map((scheme, i) => (
              <SchemeCard key={scheme.schemeName + i} scheme={scheme} index={i} />
            ))}
          </motion.div>
        )}

        {!loading && !searched && (
          <EmptyState
            icon={Search}
            title="Start your search"
            description="Choose your state and crop above to see relevant government schemes."
          />
        )}
      </div>
    </div>
  );
}
