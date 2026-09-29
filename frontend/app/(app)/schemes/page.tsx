"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  Landmark,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
} from "lucide-react";
import type {
  Scheme,
  SchemeRecommendation,
  SchemeExplainResult,
  SchemeMatchDetails,
} from "@/lib/types";

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

export default function SchemesPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();

  const [activeTab, setActiveTab] = useState<"recommended" | "all">("recommended");
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for "All Schemes" tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedType, setSelectedType] = useState<"all" | "central" | "state">("all");

  // Detail Modal State
  const [activeScheme, setActiveScheme] = useState<Scheme | null>(null);
  const [activeMatch, setActiveMatch] = useState<SchemeMatchDetails | null>(null);

  // AI Explainer State
  const [explainLang, setExplainLang] = useState<"en" | "hi" | "hinglish">("en");
  const [explainQuestion, setExplainQuestion] = useState("");
  const [explainResult, setExplainResult] = useState<SchemeExplainResult | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Load recommendations
  async function loadRecommendations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFarm?.id) params.set("farm_id", selectedFarm.id);
      if (selectedCategory !== "All") params.set("category", selectedCategory);

      const data = await api.get<SchemeRecommendation[]>(
        `/schemes/recommended?${params.toString()}`
      );
      setRecommendations(data || []);
    } catch (err) {
      console.error("Failed to load recommended schemes:", err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  // Load all schemes with filters
  async function loadAllSchemes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedState !== "All States") params.set("state", selectedState);
      if (selectedType !== "all") params.set("scheme_type", selectedType);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const data = await api.get<Scheme[]>(`/schemes?${params.toString()}`);
      setAllSchemes(data || []);
    } catch (err) {
      console.error("Failed to load all schemes:", err);
      setAllSchemes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "recommended") {
      loadRecommendations();
    } else {
      loadAllSchemes();
    }
  }, [
    activeTab,
    selectedFarm?.id,
    selectedCategory,
    selectedState,
    selectedType,
    searchQuery,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  function openDetails(scheme: Scheme, match?: SchemeMatchDetails) {
    setActiveScheme(scheme);
    setActiveMatch(match || null);
    setExplainResult(null);
    setExplainQuestion("");
  }

  function closeDetails() {
    setActiveScheme(null);
    setActiveMatch(null);
    setExplainResult(null);
  }

  async function handleExplain() {
    if (!activeScheme) return;
    setExplainLoading(true);
    try {
      const res = await api.post<SchemeExplainResult>(
        `/schemes/${activeScheme.id}/explain`,
        {
          language: explainLang,
          question: explainQuestion.trim() || undefined,
        }
      );
      setExplainResult(res);
    } catch (err) {
      console.error("AI explanation failed:", err);
    } finally {
      setExplainLoading(false);
    }
  }

  function isStale(lastVerified: string | null | undefined): boolean {
    if (!lastVerified) return true;
    const verifiedDate = new Date(lastVerified);
    const diffDays = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 180; // Older than 6 months
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-primary-900">
              Government Scheme Navigator
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified Official Data
            </span>
          </div>
          <p className="mt-1 text-sm text-primary-600">
            Official government schemes from myScheme, Ministry of Agriculture & State Portals.
            Deterministic matching based on your farm profile — no invented claims.
          </p>
        </div>

        {selectedFarm && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-1.5 text-xs text-primary-800">
            <Building2 className="h-4 w-4 text-primary-600" />
            <span>
              Matching Context: <strong>{selectedFarm.name}</strong> ({selectedFarm.state}
              {selectedFarm.area ? `, ${selectedFarm.area} ${selectedFarm.area_unit}` : ""})
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-primary-200">
        <button
          onClick={() => setActiveTab("recommended")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "recommended"
              ? "border-primary-700 text-primary-900 font-semibold"
              : "border-transparent text-primary-500 hover:border-primary-300 hover:text-primary-700"
          }`}
        >
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Recommended for Your Farm
          {recommendations.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {recommendations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "border-primary-700 text-primary-900 font-semibold"
              : "border-transparent text-primary-500 hover:border-primary-300 hover:text-primary-700"
          }`}
        >
          <Landmark className="h-4 w-4 text-primary-600" />
          All Government Schemes
        </button>
      </div>

      {/* Recommended Tab View */}
      {activeTab === "recommended" && (
        <div className="space-y-4">
          {/* Transparency & Disclaimer Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">
                How Annapoorna AI Recommends Schemes
              </p>
              <p className="text-emerald-800">
                Schemes are marked as <strong>Potential Match</strong> based on your farm&apos;s
                state, active crops, and land size compared against verified government eligibility
                criteria. <strong>Annapoorna AI never claims 100% eligibility</strong>. Unverified
                conditions (e.g. land ownership title, income exclusion, Aadhaar-DBT linkage) must
                be confirmed directly on the official portal.
              </p>
            </div>
          </div>

          {/* Category Filter Pills for Recommended */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-primary-600 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary-800 text-white"
                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!loading && recommendations.length === 0 && (
            <EmptyState
              icon={Landmark}
              title="No matching schemes found"
              description={
                selectedCategory !== "All"
                  ? `No active schemes found under '${selectedCategory}' matching your current farm profile. Try switching categories or browse all schemes.`
                  : "We couldn't find any potential matches for your current farm profile. Ensure your farm state and crops are updated, or explore all schemes below."
              }
            />
          )}

          {/* Recommendations Grid */}
          {!loading && recommendations.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => {
                const s = rec.scheme;
                const m = rec.match;
                const stale = isStale(s.last_verified);

                return (
                  <div
                    key={s.id}
                    className="card flex flex-col justify-between border border-primary-200 hover:border-primary-400 transition-all hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-primary-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800">
                            {s.category}
                          </span>
                          <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                            {s.scheme_type === "state"
                              ? `State (${s.state || "State"})`
                              : "Central Scheme"}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Potential Match
                        </span>
                      </div>

                      {/* Title & Short Name */}
                      <div className="mt-3">
                        <h3 className="text-base font-bold text-primary-900 leading-snug">
                          {s.name}
                        </h3>
                        {s.short_name && (
                          <span className="mt-0.5 inline-block text-xs font-semibold text-emerald-700">
                            {s.short_name}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-primary-700 line-clamp-2">
                        {s.description}
                      </p>

                      {/* Why it may be relevant */}
                      {m.reasons && m.reasons.length > 0 && (
                        <div className="mt-3 rounded-md bg-emerald-50/70 p-2.5 text-xs text-emerald-950">
                          <p className="font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            Why it may be relevant:
                          </p>
                          <ul className="space-y-0.5 pl-4 list-disc text-emerald-900">
                            {m.reasons.slice(0, 3).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Still needs verification */}
                      {m.missing_information && m.missing_information.length > 0 && (
                        <div className="mt-2 rounded-md bg-amber-50/70 p-2.5 text-xs text-amber-950">
                          <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            Still needs verification:
                          </p>
                          <ul className="space-y-0.5 pl-4 list-disc text-amber-900">
                            {m.missing_information.slice(0, 2).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="mt-4 pt-3 border-t border-primary-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] text-primary-500">
                        <span className="truncate max-w-[200px]" title={s.ministry_or_department || s.source || ""}>
                          🏛️ {s.ministry_or_department || s.source || "Official Govt Source"}
                        </span>
                        <span className={stale ? "text-amber-600 font-medium" : ""}>
                          📅 {s.last_verified ? formatDate(s.last_verified) : "Verified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openDetails(s, m)}
                          className="btn-secondary flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          View Details & AI Explainer
                        </button>

                        {s.official_url && (
                          <a
                            href={s.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-primary-300 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                            title="Visit official portal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Portal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Schemes Tab View */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary-400" />
              <input
                className="input pl-9 w-full text-xs"
                placeholder="Search scheme name, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="input text-xs"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              className="input text-xs"
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as "all" | "central" | "state")
              }
            >
              <option value="all">All Scheme Types (Central & State)</option>
              <option value="central">Central Government Schemes Only</option>
              <option value="state">State Specific Schemes Only</option>
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary-800 text-white"
                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!loading && allSchemes.length === 0 && (
            <EmptyState
              icon={Landmark}
              title="No schemes found"
              description="No government schemes matched your filter criteria. Try clearing search or choosing another state/category."
            />
          )}

          {/* All Schemes Grid */}
          {!loading && allSchemes.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {allSchemes.map((s) => {
                const stale = isStale(s.last_verified);

                return (
                  <div
                    key={s.id}
                    className="card flex flex-col justify-between border border-primary-200 hover:border-primary-400 transition-all hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-primary-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800">
                            {s.category}
                          </span>
                          <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                            {s.scheme_type === "state"
                              ? `State: ${s.state || "State"}`
                              : "Central Scheme"}
                          </span>
                        </div>
                        {s.short_name && (
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {s.short_name}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 text-base font-bold text-primary-900 leading-snug">
                        {s.name}
                      </h3>
                      <p className="mt-2 text-xs text-primary-700 line-clamp-3">
                        {s.description}
                      </p>

                      {/* Key Benefits Preview */}
                      {s.benefits && s.benefits.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-primary-800 mb-1">
                            Key Benefits:
                          </p>
                          <ul className="space-y-0.5 pl-4 list-disc text-xs text-primary-600">
                            {s.benefits.slice(0, 2).map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="mt-4 pt-3 border-t border-primary-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] text-primary-500">
                        <span className="truncate max-w-[200px]" title={s.ministry_or_department || s.source || ""}>
                          🏛️ {s.ministry_or_department || s.source || "Official Govt Source"}
                        </span>
                        <span className={stale ? "text-amber-600 font-medium" : ""}>
                          📅 {s.last_verified ? formatDate(s.last_verified) : "Verified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openDetails(s)}
                          className="btn-secondary flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          View Full Details & AI
                        </button>

                        {s.official_url && (
                          <a
                            href={s.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-primary-300 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Portal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Scheme Details & AI Explainer Modal */}
      {activeScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl border border-primary-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-primary-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="rounded bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
                    {activeScheme.category}
                  </span>
                  <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                    {activeScheme.scheme_type === "state"
                      ? `State: ${activeScheme.state}`
                      : "Central Scheme"}
                  </span>
                  {activeScheme.short_name && (
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {activeScheme.short_name}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-primary-900 leading-snug">
                  {activeScheme.name}
                </h2>
                <p className="mt-1 text-xs text-primary-600">
                  🏛️ {activeScheme.ministry_or_department || activeScheme.source || "Government Department"}
                  {activeScheme.last_verified && (
                    <span> • Last verified from official sources on: {formatDate(activeScheme.last_verified)}</span>
                  )}
                </p>
              </div>

              <button
                onClick={closeDetails}
                className="rounded-lg p-1.5 text-primary-400 hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 text-xs text-primary-800">
              {/* Official Source & Staleness Warning */}
              {isStale(activeScheme.last_verified) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <strong>Notice:</strong> This scheme information was last verified over 6 months ago.
                    Please confirm current eligibility guidelines and deadlines on the official government portal before applying.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">
                  Scheme Overview
                </h4>
                <p className="text-sm text-primary-700 leading-relaxed">
                  {activeScheme.description}
                </p>
              </div>

              {/* Farm Profile Match Context if available */}
              {activeMatch && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500">
                    Farm Profile Relevance
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeMatch.reasons?.length > 0 && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                        <p className="font-semibold text-emerald-950 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Why it may be relevant:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-emerald-900">
                          {activeMatch.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeMatch.missing_information?.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                        <p className="font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Still needs verification:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-amber-900">
                          {activeMatch.missing_information.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {activeScheme.benefits && activeScheme.benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1.5">
                    Official Benefits & Subsidies
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-primary-700">
                    {activeScheme.benefits.map((b, i) => (
                      <li key={i} className="leading-snug">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Eligibility Criteria */}
              {activeScheme.eligibility && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1.5">
                    Official Eligibility Criteria
                  </h4>
                  {Array.isArray(activeScheme.eligibility) ? (
                    <ul className="space-y-1.5 pl-5 list-disc text-primary-700">
                      {activeScheme.eligibility.map((e, i) => (
                        <li key={i} className="leading-snug">
                          {e}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-primary-700">{JSON.stringify(activeScheme.eligibility)}</p>
                  )}
                </div>
              )}

              {/* Documents Required */}
              {(activeScheme.documents_required?.length || activeScheme.required_documents?.length) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1.5">
                    Documents Required for Application
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(activeScheme.documents_required || activeScheme.required_documents || []).map(
                      (doc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-800"
                        >
                          <FileText className="h-3 w-3 text-primary-600" />
                          {doc}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* How to Apply / Application Process */}
              {activeScheme.application_process && activeScheme.application_process.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1.5">
                    How to Apply (Official Steps)
                  </h4>
                  <ol className="space-y-1.5 pl-5 list-decimal text-primary-700">
                    {activeScheme.application_process.map((step, i) => (
                      <li key={i} className="leading-snug">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Groq AI Scheme Explainer Section */}
              <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary-900">
                      AI Scheme Explainer (Grounded in Verified Data)
                    </h4>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-primary-200 bg-white p-0.5 text-xs">
                    <button
                      onClick={() => setExplainLang("en")}
                      className={`px-2 py-0.5 rounded ${
                        explainLang === "en"
                          ? "bg-primary-800 text-white font-medium"
                          : "text-primary-600 hover:bg-primary-100"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setExplainLang("hi")}
                      className={`px-2 py-0.5 rounded ${
                        explainLang === "hi"
                          ? "bg-primary-800 text-white font-medium"
                          : "text-primary-600 hover:bg-primary-100"
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      onClick={() => setExplainLang("hinglish")}
                      className={`px-2 py-0.5 rounded ${
                        explainLang === "hinglish"
                          ? "bg-primary-800 text-white font-medium"
                          : "text-primary-600 hover:bg-primary-100"
                      }`}
                    >
                      Hinglish
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-primary-600">
                  Ask AI to explain this scheme in simple words, or clarify application requirements.
                  The AI only uses verified scheme data and never invents eligibility rules.
                </p>

                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-xs"
                    placeholder="Ask a question (e.g. 'Can tenant farmers apply?' or leave blank for full summary)..."
                    value={explainQuestion}
                    onChange={(e) => setExplainQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleExplain()}
                  />
                  <button
                    onClick={handleExplain}
                    disabled={explainLoading}
                    className="btn-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    {explainLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Explain
                  </button>
                </div>

                {/* AI Explanation Result Display */}
                {explainResult && (
                  <div className="mt-3 rounded-lg border border-primary-200 bg-white p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-primary-100 pb-2">
                      <span className="font-semibold text-xs text-primary-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        Grounded AI Explanation ({explainResult.language.toUpperCase()})
                      </span>
                      {explainResult.official_source && (
                        <span className="text-[10px] text-primary-500">
                          Source: {explainResult.official_source}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-primary-800 whitespace-pre-line leading-relaxed">
                      {explainResult.explanation}
                    </div>

                    <div className="mt-2 rounded bg-amber-50 p-2 text-[10px] text-amber-800 border border-amber-200">
                      <strong>Official Disclaimer:</strong> {explainResult.disclaimer}
                    </div>
                  </div>
                )}
              </div>

              {/* Critical Legal Disclaimer */}
              <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3 text-[11px] text-primary-700">
                <p>
                  <strong>Important Notice:</strong> Government scheme guidelines, subsidies, and eligibility rules
                  are subject to periodic revisions by the respective ministries. Always verify current details and
                  submit applications only through the authorized official government portal or your nearest Common Service Centre (CSC) / Agriculture Department office.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-primary-100 pt-3">
              <button
                onClick={closeDetails}
                className="btn-secondary px-4 py-2 text-xs font-medium"
              >
                Close
              </button>

              {activeScheme.official_url && (
                <a
                  href={activeScheme.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Official Government Portal
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
