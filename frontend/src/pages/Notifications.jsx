import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  CloudSun,
  ShieldAlert,
  Sprout,
  DollarSign,
  TrendingUp,
  Landmark,
  Check,
} from "lucide-react";
import notificationsApi from "../api/notifications";
import { useTranslation } from "../contexts/LanguageContext";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import { formatDate, formatDateTime } from "../utils/formatters";

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list(unreadOnly);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      alert("Failed to mark notification as read: " + err.message);
    }
  };

  const getCategoryIcon = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("weather")) return <CloudSun className="h-4 w-4 text-sky-500" />;
    if (c.includes("health") || c.includes("doctor")) return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    if (c.includes("market") || c.includes("mandi")) return <TrendingUp className="h-4 w-4 text-purple-500" />;
    if (c.includes("scheme")) return <Landmark className="h-4 w-4 text-amber-500" />;
    return <Sprout className="h-4 w-4 text-primary-600" />;
  };

  const filteredNotifs = notifications.filter((n) => {
    if (selectedCategory === "all") return true;
    return (n.category || "").toLowerCase() === selectedCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("notifications.title", "Agricultural Alerts & Notifications")}
            subtitle="Advisories regarding pest outbreaks, scheduled field tasks, mandi price movements, and weather alerts."
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Show unread alerts only
          </label>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {["all", "weather", "tasks", "crop_health", "market", "schemes"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts to display"
          description={
            unreadOnly
              ? "All notifications have been read."
              : "No farm alerts or notifications recorded."
          }
        />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between p-4 transition ${
                !n.read
                  ? "bg-primary-50/40 dark:bg-primary-950/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  {getCategoryIcon(n.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={`text-sm ${
                        !n.read
                          ? "font-bold text-slate-900 dark:text-white"
                          : "font-semibold text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {n.title}
                    </h4>

                    {!n.read && (
                      <span className="flex h-2 w-2 rounded-full bg-primary-600" title="Unread" />
                    )}

                    {n.priority && n.priority !== "normal" && (
                      <Badge variant="warning" className="text-[10px]">
                        {n.priority}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {n.message}
                  </p>

                  <span className="text-[11px] text-slate-400 block">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
