import React, { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Building2,
  Calendar,
  FileText,
  X,
  HelpCircle,
  ChevronRight,
  Info,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import schemesApi from "../api/schemes";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import ErrorState from "../components/common/ErrorState";

const CATEGORIES = [
  "All",
  "Income Support",
  "Crop Insurance",
  "Credit / Loans",
  "Irrigation",
  "Equipment",
  "Seeds",
  "Soil Health",
  "Organic Farming",
  "Solar / Energy",
  "Market Support",
];

const STATES = [
  "All States",
  "Uttar Pradesh",
  "Maharashtra",
  "Madhya Pradesh",
  "Punjab",
  "Haryana",
  "Rajasthan",
  "Bihar",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "West Bengal",
];

export default function Schemes() {
  const { t } = useTranslation();
  const { selectedFarm } = useFarms();

  const [activeTab, setActiveTab] = useState("recommended");
  const [recommendations, setRecommendations] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for All Schemes tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedType, setSelectedType] = useState("all");

  // Details Modal
  const [activeScheme, setActiveScheme] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);

  // AI Explainer State
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainLang, setExplainLang] = useState("en");
  const [explainQuestion, setExplainQuestion] = useState("");
  const [explainResult, setExplainResult] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "recommended") {
        const data = await schemesApi.getRecommendations(selectedFarm?.id);
        setRecommendations(Array.isArray(data) ? data : []);
      } else {
        const data = await schemesApi.list();
        setAllSchemes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err?.message || "Failed to load government agricultural schemes.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedFarm?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAskAI = async (scheme) => {
    setActiveScheme(scheme);
    setExplainModalOpen(true);
    setExplainResult(null);
    setExplainQuestion("");
    setExplainLoading(true);
    try {
      const res = await schemesApi.explain(scheme.id, {
        language: explainLang,
        question: "",
        farm_id: selectedFarm?.id,
      });
      setExplainResult(res);
    } catch (err) {
      setExplainResult({ summary: "Failed to generate AI explanation: " + err.message });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleSendCustomQuestion = async () => {
    if (!explainQuestion.trim() || !activeScheme) return;
    setExplainLoading(true);
    try {
      const res = await schemesApi.explain(activeScheme.id, {
        language: explainLang,
        question: explainQuestion,
        farm_id: selectedFarm?.id,
      });
      setExplainResult(res);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setExplainLoading(false);
    }
  };

  // Filter all schemes
  const filteredSchemes = allSchemes.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchBen = s.benefits_summary?.toLowerCase().includes(q);
      if (!matchName && !matchBen) return false;
    }
    if (selectedCategory !== "All" && s.category !== selectedCategory) return false;
    if (selectedState !== "All States" && s.state !== selectedState && s.level !== "central") return false;
    if (selectedType !== "all" && s.level !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("schemes.title", "Government Schemes & Farmer Subsidies")}
        subtitle="Explore Central & State financial assistance, crop insurance, solar subsidies, and credit programs."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("recommended")}
          className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeTab === "recommended"
              ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Matched for Your Farm {recommendations.length > 0 && `(${recommendations.length})`}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeTab === "all"
              ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          All Government Schemes
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={loadData} />}

      {/* TAB 1: RECOMMENDED SCHEMES */}
      {!loading && !error && activeTab === "recommended" && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="No specific recommendations"
              description="Make sure your farm location and crops are set, or browse all schemes available nationwide."
              actionLabel="Browse All Schemes"
              onAction={() => setActiveTab("all")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => {
                const s = rec.scheme || rec;
                return (
                  <div
                    key={s.id}
                    className="card flex flex-col justify-between space-y-4 transition hover:border-primary-300 dark:hover:border-primary-800"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant={s.level === "central" ? "default" : "neutral"} className="capitalize">
                          {s.level || "Central"} Scheme
                        </Badge>
                        {s.category && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {s.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 dark:text-slate-300 leading-relaxed">
                        {s.benefits_summary || s.description}
                      </p>

                      {rec.relevance_reasons && rec.relevance_reasons.length > 0 && (
                        <div className="rounded-lg bg-primary-50/70 p-2 text-xs text-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
                          <span className="font-semibold">Why relevant: </span>
                          <span>{rec.relevance_reasons.join(" • ")}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setActiveScheme(s);
                          setActiveMatch(rec.match_details || null);
                        }}
                        className="btn-secondary text-xs"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        View Details
                      </button>

                      <button
                        onClick={() => handleAskAI(s)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-400"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ask AI Explainer
                      </button>

                      {s.official_portal_url && (
                        <a
                          href={s.official_portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL SCHEMES WITH FILTERS */}
      {!loading && !error && activeTab === "all" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="card space-y-3">
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schemes by name or keyword..."
                  className="input text-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="input text-xs"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredSchemes.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="No schemes matched your search"
              description="Try selecting a different category or clearing your search keywords."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSchemes.map((s) => (
                <div
                  key={s.id}
                  className="card flex flex-col justify-between space-y-4 transition hover:border-primary-300 dark:hover:border-primary-800"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={s.level === "central" ? "default" : "neutral"} className="capitalize">
                        {s.level || "Central"} Scheme
                      </Badge>
                      {s.category && (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {s.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 dark:text-slate-300 leading-relaxed">
                      {s.benefits_summary || s.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveScheme(s);
                        setActiveMatch(null);
                      }}
                      className="btn-secondary text-xs"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      View Details
                    </button>

                    <button
                      onClick={() => handleAskAI(s)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-400"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ask AI Explainer
                    </button>

                    {s.official_portal_url && (
                      <a
                        href={s.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEME DETAIL MODAL */}
      {activeScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-[#142219] border border-primary-100 dark:border-[#1e3627] space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <Badge variant={activeScheme.level === "central" ? "default" : "neutral"} className="capitalize mb-1">
                  {activeScheme.level} Scheme • {activeScheme.category}
                </Badge>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeScheme.name}</h2>
              </div>
              <button onClick={() => setActiveScheme(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Benefits & Financial Assistance</h4>
                <p className="mt-1 leading-relaxed">{activeScheme.benefits_summary || activeScheme.description}</p>
              </div>

              {activeScheme.eligibility_criteria && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Eligibility Criteria</h4>
                  <p className="mt-1 leading-relaxed">{activeScheme.eligibility_criteria}</p>
                </div>
              )}

              {activeScheme.documents_required && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Required Documents</h4>
                  <p className="mt-1 leading-relaxed">{activeScheme.documents_required}</p>
                </div>
              )}

              {activeScheme.application_process && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">How to Apply</h4>
                  <p className="mt-1 leading-relaxed">{activeScheme.application_process}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {activeScheme.official_portal_url ? (
                <a
                  href={activeScheme.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Visit Official Government Portal
                </a>
              ) : <div />}

              <button onClick={() => setActiveScheme(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI EXPLAINER MODAL */}
      {explainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-[#142219] border border-primary-100 dark:border-[#1e3627] space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Scheme Explainer: {activeScheme?.name}
                </h3>
              </div>
              <button onClick={() => setExplainModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {explainLoading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-xs text-slate-500">Annapoorna is breaking down the government policy...</p>
              </div>
            ) : explainResult ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Simple Explanation</h4>
                  <p>{explainResult.summary || explainResult.explanation}</p>
                </div>

                {explainResult.key_takeaways && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">Key Takeaways</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {explainResult.key_takeaways.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Custom Question */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ask a specific question about this scheme:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={explainQuestion}
                  onChange={(e) => setExplainQuestion(e.target.value)}
                  placeholder="e.g. Can tenant farmers apply? How much subsidy for drip?"
                  className="input text-xs"
                />
                <button
                  type="button"
                  onClick={handleSendCustomQuestion}
                  disabled={explainLoading || !explainQuestion.trim()}
                  className="btn-primary text-xs shrink-0"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
