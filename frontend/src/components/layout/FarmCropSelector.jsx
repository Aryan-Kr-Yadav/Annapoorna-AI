import React, { useState, useEffect, useRef } from "react";
import { Tractor, Sprout, ChevronDown, Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useFarms } from "../../contexts/FarmContext";
import { useTranslation } from "../../contexts/LanguageContext";
import { formatFarmId } from "../../utils/formatters";
import { cn } from "../../utils/cn";

export function FarmCropSelector() {
  const { farms, selectedFarm, selectFarm, crops, selectedCrop, selectCrop } = useFarms();
  const { t } = useTranslation();

  const [farmOpen, setFarmOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const farmRef = useRef(null);
  const cropRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (farmRef.current && !farmRef.current.contains(event.target)) {
        setFarmOpen(false);
      }
      if (cropRef.current && !cropRef.current.contains(event.target)) {
        setCropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Farm Dropdown */}
      <div className="relative" ref={farmRef}>
        <button
          type="button"
          onClick={() => {
            setFarmOpen((prev) => !prev);
            setCropOpen(false);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border border-primary-200 dark:border-primary-800 bg-white/90 dark:bg-[#1a2418] px-2.5 py-1.5 text-xs font-semibold text-primary-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs",
            farmOpen && "border-primary-500 ring-1 ring-primary-500"
          )}
          title="Switch Active Farm"
        >
          <Tractor className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
          <span className="max-w-[110px] sm:max-w-[150px] truncate">
            {selectedFarm?.name || t("context.select_farm", "Select Farm")}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
        </button>

        {farmOpen && (
          <div className="absolute left-0 mt-1.5 w-56 rounded-2xl border border-primary-100 dark:border-primary-900/60 bg-white dark:bg-[#162014] py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-2xs font-bold uppercase tracking-wider text-stone-400">
              {t("context.all_farms", "My Farms")}
            </div>
            {farms.length === 0 ? (
              <div className="px-3 py-2 text-xs text-stone-500">
                {t("dash.no_farm", "No farms added yet")}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto py-1">
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
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer",
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-950/60 font-semibold text-primary-900 dark:text-primary-200"
                          : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-primary-900/30"
                      )}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate">{f.name}</p>
                        <p className="text-2xs text-stone-400">
                          {f.district}, {f.state} • <span className="font-mono text-3xs font-semibold text-emerald-700 dark:text-emerald-400">ID: {formatFarmId(f.id)}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="border-t border-primary-50 dark:border-primary-950 mt-1 pt-1 px-1">
              <Link
                to="/farms"
                onClick={() => setFarmOpen(false)}
                className="flex items-center gap-1.5 w-full rounded-lg px-2.5 py-1.5 text-xs text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("farms.add_farm", "Manage Farms")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Crop Dropdown */}
      {selectedFarm && (
        <div className="relative" ref={cropRef}>
          <button
            type="button"
            onClick={() => {
              setCropOpen((prev) => !prev);
              setFarmOpen(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-primary-200 dark:border-primary-800 bg-white/90 dark:bg-[#1a2418] px-2.5 py-1.5 text-xs font-semibold text-primary-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs",
              cropOpen && "border-primary-500 ring-1 ring-primary-500"
            )}
            title="Switch Active Crop"
          >
            <Sprout className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[140px] truncate">
              {selectedCrop ? `${selectedCrop.crop_name}` : t("context.select_crop", "Select Crop")}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          </button>

          {cropOpen && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-2xl border border-primary-100 dark:border-primary-900/60 bg-white dark:bg-[#162014] py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-2xs font-bold uppercase tracking-wider text-stone-400">
                {t("crops.crop_name", "Crops")} — {selectedFarm.name}
              </div>
              {crops.length === 0 ? (
                <div className="px-3 py-2 text-xs text-stone-500">
                  {t("dash.no_active_crop", "No crops planted yet")}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto py-1">
                  {crops.map((c) => {
                    const isSelected = c.id === selectedCrop?.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectCrop(c.id);
                          setCropOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer",
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-900 dark:text-emerald-200"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-primary-900/30"
                        )}
                      >
                        <div className="truncate mr-2">
                          <p className="truncate">{c.crop_name}</p>
                          <p className="text-2xs text-stone-400 capitalize">
                            {c.season} {c.year}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="border-t border-primary-50 dark:border-primary-950 mt-1 pt-1 px-1">
                <Link
                  to={`/farms/${selectedFarm.id}`}
                  onClick={() => setCropOpen(false)}
                  className="flex items-center gap-1.5 w-full rounded-lg px-2.5 py-1.5 text-xs text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("farms.add_crop", "Add Crop Cycle")}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FarmCropSelector;
