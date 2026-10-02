import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tractor,
  MapPin,
  Sprout,
  MoreVertical,
  Pencil,
  Plus,
  BarChart3,
  Trash2,
  ArrowRight,
  Clock,
  Droplets,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { useFarms } from "../../contexts/FarmContext";
import { formatFarmId } from "../../utils/formatters";
import { cn } from "../../utils/cn";

export function FarmCard({
  farm,
  crops = [],
  tasks = [],
  onEdit = () => {},
  onAddCrop = () => {},
  onDelete = () => {},
}) {
  const navigate = useNavigate();
  const { selectFarm } = useFarms();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCrops = crops.filter((c) => c.status === "active");
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  const handleOpenFarm = () => {
    selectFarm(farm.id);
    navigate(`/farms/${farm.id}`);
  };

  return (
    <div className="card flex flex-col justify-between hover:border-primary-400 dark:hover:border-primary-700/60 transition shadow-xs hover:shadow-sm group">
      <div>
        {/* Top Header: Icon, Name, Location & Actions Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 font-bold shadow-2xs">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--foreground)] group-hover:text-primary-700 dark:group-hover:text-primary-400 transition tracking-tight">
                {farm.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-[var(--foreground-muted)] mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                  <span>
                    {farm.village_or_city ? `${farm.village_or_city}, ` : ""}
                    {farm.district}, {farm.state}
                  </span>
                </span>
                <span>•</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {farm.area} {farm.area_unit || "acres"}
                </span>
              </div>

              {/* Copy Farm ID chip */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const shortCode = formatFarmId(farm.id);
                    navigator.clipboard.writeText(shortCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-secondary)] text-3xs font-mono text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-primary-400 transition cursor-pointer"
                  title="Click to copy 6-character Farm ID"
                >
                  <span className="font-sans font-bold text-stone-400">ID:</span>
                  <span className="font-mono font-bold tracking-wider">{formatFarmId(farm.id)}</span>
                  {copied ? (
                    <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-stone-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Three-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Farm options"
              className="p-1.5 rounded-lg text-stone-400 hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(farm);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition text-left cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-stone-400" />
                  <span>Edit Farm</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddCrop(farm);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition text-left cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-stone-400" />
                  <span>Add Crop</span>
                </button>
                <Link
                  to={`/analytics?farm_id=${farm.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition text-left"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-stone-400" />
                  <span>Analytics</span>
                </Link>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(farm);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Farm</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ALL Active Crops with Stages (Requirement 17) */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-3xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
              All Active Crops
            </span>
            <button
              type="button"
              onClick={() => onAddCrop(farm)}
              className="text-2xs font-semibold text-primary-700 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>

          {activeCrops.length === 0 ? (
            <p className="text-2xs text-[var(--foreground-muted)] italic">
              No crops currently planted in this field.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {activeCrops.map((c) => (
                <Link
                  key={c.id}
                  to={`/crops/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-900 dark:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition shadow-2xs"
                  title={`View ${c.crop_name} Diary`}
                >
                  <Sprout className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                  <span>{c.crop_name}</span>
                  <span className="text-2xs font-normal text-primary-700 dark:text-primary-400">
                    • {c.current_stage || "Active"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Soil Profile & Irrigation Source Specifications */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)] text-2xs">
          <div className="p-2 rounded-lg bg-[var(--surface-secondary)]/50">
            <span className="text-[var(--foreground-muted)] block font-medium">Soil Texture</span>
            <span className="font-bold text-[var(--foreground)] capitalize mt-0.5 block">
              {farm.soil_type || "Loamy"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[var(--surface-secondary)]/50">
            <span className="text-[var(--foreground-muted)] block font-medium">Irrigation Source</span>
            <span className="font-bold text-[var(--foreground)] capitalize mt-0.5 block">
              {farm.irrigation_type || "Rainfed"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer bar: Tasks Due + Open Farm */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-2xs text-[var(--foreground-muted)]">
          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>
            <strong className="text-[var(--foreground)]">{pendingTasks.length}</strong> tasks due
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/analytics?farm_id=${farm.id}`}
            className="text-2xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition px-2 py-1 rounded hover:bg-[var(--surface-secondary)]"
          >
            Analytics
          </Link>
          <button
            type="button"
            onClick={handleOpenFarm}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition group-hover:translate-x-0.5 cursor-pointer"
          >
            <span>Open Farm</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmCard;
