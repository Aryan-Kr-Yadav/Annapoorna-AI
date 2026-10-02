import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  Tractor,
  Sprout,
  Shield,
  Edit2,
  Settings,
  Layers,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import usersApi from "../api/users";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import Badge from "../components/common/Badge";
import Skeleton from "../components/common/Skeleton";
import { formatDate } from "../utils/formatters";

export default function Profile() {
  const { user: authUser } = useAuth();
  const { farms, crops } = useFarms();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getMe()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const totalAcreage = farms.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("settings.account", "Farmer Profile")}
            subtitle="Account ownership, verified credentials, and managed landholding holdings."
          />
        </div>

        <Link to="/settings" className="btn-secondary text-xs">
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Edit Preferences
        </Link>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 text-2xl font-bold dark:bg-primary-950/60 dark:text-primary-200">
              {(profile?.full_name || authUser?.name || "Farmer").charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile?.full_name || authUser?.name || "Annapoorna Farmer"}
                </h2>
                <Badge variant="success">Verified Account</Badge>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {profile?.email || authUser?.email}
              </p>

              <p className="text-[11px] text-slate-400">
                Member since {profile?.created_at ? formatDate(profile.created_at) : "2026"}
              </p>
            </div>
          </div>

          {/* Farm Holdings Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Registered Farms</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{farms.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Active Crop Cycles</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{crops.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Cultivable Area</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalAcreage} Acres</p>
            </div>
          </div>
        </div>
      )}

      {/* Farms List */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Managed Land Parcels</h3>
          <Link to="/farms" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            View All Farms →
          </Link>
        </div>

        {farms.length === 0 ? (
          <p className="text-xs text-slate-400">No farms registered yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {farms.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <Tractor className="h-4 w-4 text-primary-600" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{f.name}</span>
                    <span className="ml-2 text-slate-500">{f.district}, {f.state}</span>
                  </div>
                </div>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  {f.area} {f.area_unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
