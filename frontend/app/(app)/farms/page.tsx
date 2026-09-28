"use client";

import Link from "next/link";
import { useFarms } from "@/lib/farm-context";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Tractor, Plus } from "lucide-react";

export default function FarmsPage() {
  const { farms, loading, error, refresh } = useFarms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-900">My Farms</h1>
        <Link href="/onboarding" className="btn-primary"><Plus className="h-4 w-4" /> Add farm</Link>
      </div>

      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && farms.length === 0 && (
        <EmptyState icon={Tractor} title="No farms yet" description="Add your first farm to get started." action={<Link href="/onboarding" className="btn-primary">Add farm</Link>} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <Link key={farm.id} href={`/farms/${farm.id}`} className="card transition hover:border-primary-300">
            <p className="font-medium text-primary-900">{farm.name}</p>
            <p className="mt-1 text-sm text-primary-600">{farm.district}, {farm.state}</p>
            <p className="mt-2 text-xs text-primary-500">{farm.area} {farm.area_unit} • {farm.irrigation_type}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
