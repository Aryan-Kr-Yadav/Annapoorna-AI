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
import { MarkdownMessage } from "../components/common/MarkdownMessage";

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
  const { t, language } = useTranslation();
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
  const [explainLang, setExplainLang] = useState(language || "en");
  const [explainQuestion, setExplainQuestion] = useState("");
  const [explainResult, setExplainResult] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Keep explainLang updated when user switches UI language
  useEffect(() => {
    if (language) {
      setExplainLang(language);
    }
  }, [language]);

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

  const handleAskAI = async (scheme, targetLang = explainLang) => {
    setActiveScheme(scheme);
    setExplainModalOpen(true);
    setExplainResult(null);
    setExplainQuestion("");
    setExplainLoading(true);
    try {
      const res = await schemesApi.explain(scheme.id, {
        language: targetLang,
        question: "",
        farm_id: selectedFarm?.id,
      });
      setExplainResult(res);
    } catch (err) {
      setExplainResult({ explanation: "Failed to generate AI explanation: " + err.message });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleExplainLangChange = async (newLang) => {
    setExplainLang(newLang);
    if (!activeScheme) return;
    setExplainLoading(true);
    try {
      const res = await schemesApi.explain(activeScheme.id, {
        language: newLang,
        question: explainQuestion.trim() || "",
        farm_id: selectedFarm?.id,
      });
      setExplainResult(res);
    } catch (err) {
      setExplainResult({ explanation: "Failed to generate AI explanation: " + err.message });
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
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#142219] border border-primary-200 dark:border-[#1e3627] space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t("schemes.explainer_title", "AI Scheme Explainer")}
                    </h3>
                    <Badge variant="primary">{activeScheme?.category || "Agriculture"}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-primary-800 dark:text-primary-300 mt-0.5">
                    {activeScheme?.name} {activeScheme?.short_name ? `(${activeScheme.short_name})` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher inside modal */}
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleExplainLangChange("en")}
                    className={`px-2 py-1 rounded-md transition ${
                      explainLang === "en"
                        ? "bg-white dark:bg-[#1f3124] text-primary-900 dark:text-primary-200 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExplainLangChange("hi")}
                    className={`px-2 py-1 rounded-md transition ${
                      explainLang === "hi"
                        ? "bg-white dark:bg-[#1f3124] text-primary-900 dark:text-primary-200 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExplainModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official Source & Verification Badge bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-2xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">{t("schemes.official_source", "Official Source")}:</strong>{" "}
                  {explainResult?.official_source || activeScheme?.source || activeScheme?.ministry_or_department || "Government of India"}
                </span>
              </div>
              {(explainResult?.official_url || activeScheme?.official_url) && (
                <a
                  href={explainResult?.official_url || activeScheme?.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary-700 dark:text-primary-400 hover:underline"
                >
                  <span>{t("schemes.official_link", "Open Official Portal")}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Content Area */}
            {explainLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                  {t("schemes.explainer_loading", "Annapoorna is breaking down the government policy into structured plain language...")}
                </p>
              </div>
            ) : explainResult ? (
              <div className="space-y-4">
                {/* Structured Markdown Rendering */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-4 sm:p-5 dark:bg-[#121c15] shadow-2xs">
                  <MarkdownMessage
                    content={explainResult.explanation || explainResult.summary || ""}
                  />
                </div>

                {/* Key Takeaways if explicitly present */}
                {Array.isArray(explainResult.key_takeaways) && explainResult.key_takeaways.length > 0 && (
                  <div className="rounded-xl bg-primary-50/70 dark:bg-primary-950/40 p-4 border border-primary-200 dark:border-primary-900/60">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary-950 dark:text-primary-200 mb-2">
                      Key Highlights for Farmers
                    </h4>
                    <ul className="space-y-1.5 text-xs text-primary-900 dark:text-primary-300">
                      {explainResult.key_takeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-primary-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verification Notice */}
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 border border-amber-200 dark:border-amber-900/40 text-2xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    {explainResult.disclaimer || t("schemes.disclaimer_title", "Scheme terms, deadlines, and budget allocations can update periodically. Always verify your state's active notification on the official portal before submitting bank or land papers.")}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Custom Interactive Question Bar */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("schemes.ask_question_label", "Ask a specific question about this scheme:")}
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCustomQuestion();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={explainQuestion}
                  onChange={(e) => setExplainQuestion(e.target.value)}
                  placeholder={t("schemes.ask_placeholder", "e.g. Can tenant farmers apply? How much subsidy for drip?")}
                  className="input text-xs flex-1"
                />
                <button
                  type="submit"
                  disabled={explainLoading || !explainQuestion.trim()}
                  className="btn-primary text-xs shrink-0 px-4"
                >
                  {explainLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>{t("schemes.ask_btn", "Ask")}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
