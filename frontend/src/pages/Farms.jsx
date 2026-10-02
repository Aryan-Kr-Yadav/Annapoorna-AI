import React, { useEffect, useState } from "react";
import { Plus, Tractor, Layers } from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import farmsApi from "../api/farms";
import cropsApi from "../api/crops";
import { FarmCard } from "../components/farms/FarmCard";
import { FarmFormModal } from "../components/farms/FarmFormModal";
import { CropFormModal } from "../components/farms/CropFormModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import { CardSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";

export function Farms() {
  const { farms, loading, error, refresh } = useFarms();

  // Farm details cache (crops and tasks per farm)
  const [detailsMap, setDetailsMap] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals state
  const [addFarmOpen, setAddFarmOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [addingCropFarm, setAddingCropFarm] = useState(null);
  const [deletingFarm, setDeletingFarm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerError, setBannerError] = useState(null);

  // Load crops & tasks for all farms
  useEffect(() => {
    if (farms.length === 0) return;
    setLoadingDetails(true);

    Promise.all(
      farms.map((f) =>
        Promise.all([
          farmsApi.getCrops(f.id).catch(() => []),
          farmsApi.getTasks(f.id).catch(() => []),
        ]).then(([crops, tasks]) => ({
          farmId: f.id,
          crops: Array.isArray(crops) ? crops : [],
          tasks: Array.isArray(tasks) ? tasks : [],
        }))
      )
    )
      .then((results) => {
        const nextMap = {};
        results.forEach((r) => {
          nextMap[r.farmId] = { crops: r.crops, tasks: r.tasks };
        });
        setDetailsMap(nextMap);
      })
      .finally(() => setLoadingDetails(false));
  }, [farms]);

  const handleCreateFarm = async (data) => {
    setActionLoading(true);
    setBannerError(null);
    try {
      await farmsApi.create(data);
      await refresh();
    } catch (err) {
      setBannerError(err.message || "Failed to create farm.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFarm = async (data) => {
    if (!editingFarm) return;
    setActionLoading(true);
    setBannerError(null);
    try {
      await farmsApi.update(editingFarm.id, data);
      await refresh();
      setEditingFarm(null);
    } catch (err) {
      setBannerError(err.message || "Failed to update farm.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFarm = async () => {
    if (!deletingFarm) return;
    setActionLoading(true);
    setBannerError(null);
    try {
      await farmsApi.delete(deletingFarm.id);
      await refresh();
      setDeletingFarm(null);
    } catch (err) {
      setBannerError(err.message || "Failed to delete farm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCrop = async (cropData) => {
    if (!addingCropFarm) return;
    setActionLoading(true);
    setBannerError(null);
    try {
      await cropsApi.create(addingCropFarm.id, cropData);
      await refresh();
      setAddingCropFarm(null);
    } catch (err) {
      setBannerError(err.message || "Failed to add crop.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="My Farms"
        subtitle="Manage your agricultural land parcels, crop cycles, and field activity."
        actions={
          <button
            type="button"
            onClick={() => setAddFarmOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Farm</span>
          </button>
        }
      />

      {bannerError && <ErrorState message={bannerError} />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : farms.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title="No farms recorded yet"
          description="Add your first farm parcel to start recording crops, field operations, and soil tests."
          action={
            <button
              type="button"
              onClick={() => setAddFarmOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Farm</span>
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => {
            const details = detailsMap[farm.id] || { crops: [], tasks: [] };
            return (
              <FarmCard
                key={farm.id}
                farm={farm}
                crops={details.crops}
                tasks={details.tasks}
                onEdit={(f) => setEditingFarm(f)}
                onAddCrop={(f) => setAddingCropFarm(f)}
                onDelete={(f) => setDeletingFarm(f)}
              />
            );
          })}
        </div>
      )}

      {/* Add Farm Modal */}
      <FarmFormModal
        open={addFarmOpen}
        onClose={() => setAddFarmOpen(false)}
        onSubmit={handleCreateFarm}
        loading={actionLoading}
      />

      {/* Edit Farm Modal */}
      <FarmFormModal
        open={!!editingFarm}
        initialData={editingFarm}
        onClose={() => setEditingFarm(null)}
        onSubmit={handleUpdateFarm}
        loading={actionLoading}
      />

      {/* Add Crop Modal */}
      <CropFormModal
        open={!!addingCropFarm}
        farmName={addingCropFarm?.name || ""}
        onClose={() => setAddingCropFarm(null)}
        onSubmit={handleAddCrop}
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingFarm}
        title="Delete Farm Parcel"
        message={`Are you sure you want to permanently delete "${deletingFarm?.name}"? All associated crops, tasks, and historical records will be deleted.`}
        confirmLabel="Delete Farm"
        onClose={() => setDeletingFarm(null)}
        onConfirm={handleDeleteFarm}
        loading={actionLoading}
      />
    </div>
  );
}

export default Farms;
