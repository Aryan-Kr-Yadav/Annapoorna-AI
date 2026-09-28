"use client";

import { useFarms } from "@/lib/farm-context";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FarmSelector() {
  const { farms, selectedFarm, selectFarm, loading } = useFarms();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="h-9 w-40 animate-pulse rounded-lg bg-primary-100" />;
  if (farms.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-800"
      >
        {selectedFarm?.name || "Select farm"}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-56 rounded-lg border border-primary-100 bg-white py-1 shadow-lg">
          {farms.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                selectFarm(f.id);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-primary-800 hover:bg-primary-50"
            >
              {f.name}
              <span className="ml-1 text-xs text-primary-400">
                ({f.district}, {f.state})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
