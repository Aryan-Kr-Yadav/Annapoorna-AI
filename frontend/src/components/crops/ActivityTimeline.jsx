import React from "react";
import {
  Stethoscope,
  Droplets,
  CheckCircle2,
  DollarSign,
  Package,
  Sprout,
  Calendar,
  Layers,
} from "lucide-react";
import { formatDate, formatCurrencyINR } from "../../utils/formatters";
import { cn } from "../../utils/cn";

export function ActivityTimeline({
  events = null,
  crop = null,
  tasks = [],
  irrigationLogs = [],
  diagnoses = [],
  expenses = [],
  harvests = [],
  sales = [],
}) {
  let allEvents = [];

  if (events && Array.isArray(events) && events.length > 0) {
    allEvents = [...events];
  } else {
    // Synthesize events from provided collections
    if (crop?.sowing_date) {
      allEvents.push({
        id: "crop-sowing",
        type: "crop",
        title: `Crop Sown: ${crop.crop_name || "Field Crop"}`,
        description: crop.variety ? `Variety: ${crop.variety}` : "Sowing commenced.",
        date: crop.sowing_date,
        badge: crop.season ? `${crop.season.toUpperCase()} ${crop.year || ""}` : "SOWING",
      });
    }

    (tasks || []).forEach((t) => {
      allEvents.push({
        id: `task-${t.id}`,
        type: "task",
        title: t.title,
        description: t.description,
        date: t.scheduled_date || t.created_at,
        badge: t.status === "completed" || t.is_completed ? "Completed" : "Scheduled",
      });
    });

    (irrigationLogs || []).forEach((i) => {
      allEvents.push({
        id: `irrigation-${i.id}`,
        type: "irrigation",
        title: `Irrigation: ${(i.method || "Watering").toUpperCase()}`,
        description: i.notes || (i.duration_minutes ? `Duration: ${i.duration_minutes} mins` : "Field watering executed."),
        date: i.date || i.created_at,
        badge: i.water_amount_liters ? `${Number(i.water_amount_liters).toLocaleString()} L` : "Irrigated",
      });
    });

    (diagnoses || []).forEach((d) => {
      allEvents.push({
        id: `diagnosis-${d.id}`,
        type: "inspection",
        title: d.disease_identified || d.possible_condition || "Crop Pathology Inspection",
        description: d.symptoms_reported || (d.treatment_recommendations?.length ? d.treatment_recommendations[0] : "Visual leaf inspection recorded."),
        date: d.created_at,
        badge: d.severity ? d.severity.toUpperCase() : "INSPECTED",
      });
    });

    (expenses || []).forEach((e) => {
      allEvents.push({
        id: `expense-${e.id}`,
        type: "expense",
        title: `Input Cost: ${(e.category || "General").toUpperCase()}`,
        description: e.notes || "Season expenditure entry.",
        amount: e.amount,
        date: e.date || e.created_at,
        badge: "Expense",
      });
    });

    (harvests || []).forEach((h) => {
      allEvents.push({
        id: `harvest-${h.id}`,
        type: "harvest",
        title: `Harvest Recorded: ${h.yield_quantity} ${h.yield_unit || "quintal"}`,
        description: h.selling_price_per_unit ? `Modal estimate: ₹${h.selling_price_per_unit}/${h.yield_unit || "quintal"}` : "Produce harvested from plot.",
        date: h.harvest_date || h.created_at,
        badge: "Harvest",
      });
    });

    (sales || []).forEach((s) => {
      allEvents.push({
        id: `sale-${s.id}`,
        type: "sale",
        title: `Crop Sale: ${s.quantity_sold} ${s.quantity_unit || s.unit || "quintal"}${s.buyer_name ? ` to ${s.buyer_name}` : ""}`,
        description: s.notes || "Commercial market sale executed.",
        amount: s.total_sale_value ?? s.total_amount,
        date: s.sale_date || s.created_at,
        badge: "Revenue",
      });
    });
  }

  if (allEvents.length === 0) {
    return (
      <div className="card py-12 text-center space-y-2">
        <Layers className="mx-auto h-8 w-8 text-stone-400" />
        <h4 className="text-sm font-bold text-[var(--foreground)]">No Farm Activities Recorded Yet</h4>
        <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto">
          Every task, watering event, expense, and pathology scan will be chronologically logged here to build your farm's permanent memory.
        </p>
      </div>
    );
  }

  // Sort chronologically descending
  const sorted = allEvents
    .filter((ev) => Boolean(ev.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIcon = (type) => {
    switch (type) {
      case "inspection":
        return {
          icon: Stethoscope,
          bg: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
          border: "border-purple-300 dark:border-purple-800",
        };
      case "irrigation":
        return {
          icon: Droplets,
          bg: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
          border: "border-sky-300 dark:border-sky-800",
        };
      case "task":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
          border: "border-emerald-300 dark:border-emerald-800",
        };
      case "expense":
        return {
          icon: DollarSign,
          bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
          border: "border-amber-300 dark:border-amber-800",
        };
      case "harvest":
      case "sale":
        return {
          icon: Package,
          bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
          border: "border-emerald-300 dark:border-emerald-800",
        };
      default:
        return {
          icon: Sprout,
          bg: "bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300",
          border: "border-primary-300 dark:border-primary-800",
        };
    }
  };

  return (
    <div className="relative pl-7 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border)]">
      {sorted.map((ev, index) => {
        const { icon: Icon, bg, border } = getEventIcon(ev.type);

        return (
          <div key={ev.id || index} className="relative group">
            {/* Timeline Node Icon on vertical spine */}
            <div
              className={cn(
                "absolute -left-7 sm:-left-8 top-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border shadow-2xs transition group-hover:scale-110",
                bg,
                border
              )}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2]" />
            </div>

            {/* Event Card */}
            <div className="card p-4 hover:border-primary-400 dark:hover:border-primary-800 transition">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <span className="text-2xs font-extrabold text-primary-700 dark:text-primary-400 tracking-wider">
                  {formatDate(ev.date)}
                </span>
                {ev.badge && (
                  <span className="rounded-full px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider bg-[var(--surface-secondary)] text-[var(--foreground-muted)] border border-[var(--border)]">
                    {ev.badge}
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] tracking-tight">
                {ev.title}
              </h4>

              {ev.description && (
                <p className="text-2xs sm:text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                  {ev.description}
                </p>
              )}

              {ev.amount !== undefined && ev.amount !== null && (
                <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-3xs text-[var(--foreground-muted)] uppercase font-semibold">Transaction Amount</span>
                  <span className={cn(
                    "text-xs font-extrabold",
                    ev.type === "sale" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                  )}>
                    {ev.type === "sale" ? "+ " : "- "}
                    {formatCurrencyINR(ev.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActivityTimeline;
