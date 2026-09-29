"use client";

import { useState, useRef, useEffect } from "react";
import { useFarms } from "@/lib/farm-context";
import { ChevronDown, Tractor, Sprout, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FarmCropSelectorProps {
  compact?: boolean;
  className?: string;
}

export function FarmCropSelector({ compact = false, className }: FarmCropSelectorProps) {
  const {
    farms,
    selectedFarm,
    selectFarm,
    crops,
    selectedCrop,
    selectCrop,
    loading,
    loadingCrops,
  } = useFarms();

  const [farmOpen, setFarmOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFarmOpen(false);
        setCropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="h-9 w-48 animate-pulse rounded-lg bg-primary-100" />;
  }

  if (farms.length === 0) {
    return (
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
      >
        <Plus className="h-3.5 w-3.5" /> Add Farm
      </Link>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Farm Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setFarmOpen((v) => !v);
            setCropOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-primary-800 shadow-sm hover:border-primary-300 hover:bg-primary-50/50 transition"
          aria-expanded={farmOpen}
          aria-haspopup="listbox"
        >
          <Tractor className="h-3.5 w-3.5 text-primary-600 shrink-0" />
          <span className="max-w-[130px] sm:max-w-[170px] truncate">
            {selectedFarm?.name || "Select Farm"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-primary-400 shrink-0 ml-0.5" />
        </button>

        {farmOpen && (
          <div className="absolute left-0 z-50 mt-1 w-64 rounded-xl border border-primary-100 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-400">
              Select Farm
            </div>
            <div className="max-h-60 overflow-y-auto">
              {farms.map((f) => {
                const isSelected = f.id === selectedFarm?.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      selectFarm(f.id);
                      setFarmOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between px-3 py-2 text-left text-xs sm:text-sm transition",
                      isSelected
                        ? "bg-primary-50 font-semibold text-primary-900"
                        : "text-primary-700 hover:bg-primary-50/80"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">{f.name}</p>
                      <p className="text-[11px] text-primary-400">
                        {f.district}, {f.state}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-primary-100 mt-1 pt-1 px-2">
              <Link
                href="/farms"
                onClick={() => setFarmOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-primary-600 hover:bg-primary-50"
              >
                <Plus className="h-3.5 w-3.5" /> Manage or Add Farm
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Crop Dropdown */}
      <div className="relative">
        <button
          type="button"
          disabled={!selectedFarm}
          onClick={() => {
            setCropOpen((v) => !v);
            setFarmOpen(false);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition",
            selectedCrop
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50"
              : "border-primary-200 bg-white text-primary-700 hover:border-primary-300 hover:bg-primary-50/50",
            !selectedFarm && "opacity-50 cursor-not-allowed"
          )}
          aria-expanded={cropOpen}
          aria-haspopup="listbox"
        >
          <Sprout className={cn("h-3.5 w-3.5 shrink-0", selectedCrop ? "text-emerald-600" : "text-primary-600")} />
          <span className="max-w-[140px] sm:max-w-[190px] truncate">
            {loadingCrops
              ? "Loading crops..."
              : selectedCrop
              ? `${selectedCrop.crop_name} (${selectedCrop.season} ${selectedCrop.year})`
              : crops.length > 0
              ? "Select Crop"
              : "No Active Crop"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-primary-400 shrink-0 ml-0.5" />
        </button>

        {cropOpen && (
          <div className="absolute left-0 sm:left-auto sm:right-0 z-50 mt-1 w-72 rounded-xl border border-primary-100 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-400">
              Crops on {selectedFarm?.name}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {crops.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-primary-500">
                  <p>No crops planted on this farm yet.</p>
                  <Link
                    href={`/farms/${selectedFarm?.id}`}
                    onClick={() => setCropOpen(false)}
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-primary-700 underline"
                  >
                    <Plus className="h-3 w-3" /> Plant a crop
                  </Link>
                </div>
              ) : (
                crops.map((c) => {
                  const isSelected = c.id === selectedCrop?.id;
                  const isActive = c.status === "active";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        selectCrop(c.id);
                        setCropOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm transition",
                        isSelected
                          ? "bg-emerald-50 font-semibold text-emerald-950"
                          : "text-primary-800 hover:bg-primary-50"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-medium">{c.crop_name}</p>
                        <p className="text-[11px] text-primary-500 capitalize">
                          {c.season} {c.year} {c.variety ? `• ${c.variety}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "harvested" || c.status === "sold"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {c.status}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedFarm && (
              <div className="border-t border-primary-100 mt-1 pt-1 px-2">
                <Link
                  href={`/farms/${selectedFarm.id}`}
                  onClick={() => setCropOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-primary-600 hover:bg-primary-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add / View Crops on Farm
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
