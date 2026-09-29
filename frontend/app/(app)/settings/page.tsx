"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFarms } from "@/lib/farm-context";
import { useTranslation } from "@/lib/i18n";
import {
  Globe,
  Tractor,
  Bot,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  LogOut,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile, UserPreferences } from "@/lib/types";

type SettingsTab = "general" | "farm" | "assistant" | "notifications" | "account";

export default function SettingsPage() {
  const api = useApi();
  const { user: authUser, logout } = useAuth();
  const { farms, refresh: refreshFarms } = useFarms();
  const { language, setLanguage, t } = useTranslation();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [uiLanguage, setUiLanguage] = useState<"en" | "hi">("en");
  const [assistantLanguage, setAssistantLanguage] = useState<"auto" | "en" | "hi" | "hinglish">("auto");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [defaultFarmId, setDefaultFarmId] = useState<string>("");
  const [areaUnit, setAreaUnit] = useState<"acre" | "hectare">("acre");
  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius");
  const [assistantStyle, setAssistantStyle] = useState<"concise" | "balanced" | "detailed">("balanced");
  const [autoFarmContext, setAutoFarmContext] = useState<boolean>(true);

  // Notifications
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifCropHealth, setNotifCropHealth] = useState(true);
  const [notifHarvest, setNotifHarvest] = useState(true);
  const [notifSchemes, setNotifSchemes] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<UserProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name || "");
        const pref = data.preferences || {};
        const lang = (pref.ui_language || data.preferred_language || "en") as "en" | "hi";
        setUiLanguage(lang);
        setAssistantLanguage(pref.assistant_language || "auto");
        setDateFormat(pref.date_format || "DD/MM/YYYY");
        setDefaultFarmId(data.default_farm_id || pref.default_farm_id || "");
        setAreaUnit(pref.area_unit || "acre");
        setTemperatureUnit(pref.temperature_unit || "celsius");
        setAssistantStyle(pref.assistant_style || "balanced");
        setAutoFarmContext(pref.assistant_auto_context !== false);

        if (pref.notifications) {
          setNotifWeather(pref.notifications.weather_alerts !== false);
          setNotifTasks(pref.notifications.task_reminders !== false);
          setNotifCropHealth(pref.notifications.crop_health_alerts !== false);
          setNotifHarvest(pref.notifications.harvest_reminders !== false);
          setNotifSchemes(pref.notifications.scheme_updates !== false);
          setNotifMarket(pref.notifications.market_alerts !== false);
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load user settings.");
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    const updatedPreferences: UserPreferences = {
      ui_language: uiLanguage,
      assistant_language: assistantLanguage,
      assistant_style: assistantStyle,
      assistant_auto_context: autoFarmContext,
      default_farm_id: defaultFarmId || null,
      area_unit: areaUnit,
      temperature_unit: temperatureUnit,
      date_format: dateFormat as any,
      notifications: {
        weather_alerts: notifWeather,
        task_reminders: notifTasks,
        crop_health_alerts: notifCropHealth,
        harvest_reminders: notifHarvest,
        scheme_updates: notifSchemes,
        market_alerts: notifMarket,
      },
    };

    try {
      const res = await api.put<UserProfile>("/users/me", {
        full_name: fullName.trim() || null,
        preferred_language: uiLanguage,
        default_farm_id: defaultFarmId || null,
        preferences: updatedPreferences,
      });

      setProfile(res);
      // Synchronize language context immediately
      if (uiLanguage !== language) {
        await setLanguage(uiLanguage);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "general" as const, label: t("settings.general", "General"), icon: Globe },
    { id: "farm" as const, label: t("settings.farm_prefs", "Farm Preferences"), icon: Tractor },
    { id: "assistant" as const, label: t("settings.ai_assistant", "AI Assistant"), icon: Bot },
    { id: "notifications" as const, label: t("settings.notifications", "Notifications"), icon: Bell },
    { id: "account" as const, label: t("settings.account", "Account & Security"), icon: Shield },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-primary-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-primary-100" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-950">
            {t("settings.title", "Settings")}
          </h1>
          <p className="text-xs sm:text-sm text-primary-600">
            Customize language, farm defaults, AI assistant behavior, and notification preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm shadow-md"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>{t("common.saved", "Saved.")}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{saving ? t("common.saving", "Saving...") : t("common.save", "Save Changes")}</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 border-b border-primary-200/80 pb-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition shrink-0",
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-primary-600 hover:bg-primary-100/70 hover:text-primary-900"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <div className="card space-y-5">
          <div className="border-b border-primary-100 pb-3">
            <h2 className="text-base font-semibold text-primary-900">General Settings</h2>
            <p className="text-xs text-primary-500">Configure your UI language, date format, and display preferences.</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="label">Preferred UI Language</label>
              <select
                className="input"
                value={uiLanguage}
                onChange={(e) => setUiLanguage(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <p className="mt-1 text-xs text-primary-500">
                Controls the language displayed across navigation, buttons, and system headers.
              </p>
            </div>

            <div>
              <label className="label">Assistant Response Language</label>
              <select
                className="input"
                value={assistantLanguage}
                onChange={(e) => setAssistantLanguage(e.target.value as any)}
              >
                <option value="auto">Auto — Match my message (Default)</option>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="hinglish">Hinglish (Hindi written in Latin script)</option>
              </select>
              <p className="mt-1 text-xs text-primary-500">
                In <strong>Auto</strong> mode, English questions receive English answers, Hindi receives Hindi, and Hinglish receives Hinglish.
              </p>
            </div>

            <div>
              <label className="label">Date Format</label>
              <select
                className="input"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 29/09/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2026-09-29)</option>
                <option value="MMM D, YYYY">MMM D, YYYY (e.g., Sep 29, 2026)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Farm Preferences */}
      {activeTab === "farm" && (
        <div className="card space-y-5">
          <div className="border-b border-primary-100 pb-3">
            <h2 className="text-base font-semibold text-primary-900">Farm & Agronomic Defaults</h2>
            <p className="text-xs text-primary-500">Default farm selection and unit standards used in logs and analytics.</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="label">Default Farm</label>
              <select
                className="input"
                value={defaultFarmId}
                onChange={(e) => setDefaultFarmId(e.target.value)}
              >
                <option value="">None (Use most recently active farm)</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.district}, {f.state})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-primary-500">
                When you open the app without a prior saved session, this farm will be loaded automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Area Unit</label>
                <select
                  className="input"
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as any)}
                >
                  <option value="acre">Acre</option>
                  <option value="hectare">Hectare</option>
                </select>
              </div>

              <div>
                <label className="label">Temperature Unit</label>
                <select
                  className="input"
                  value={temperatureUnit}
                  onChange={(e) => setTemperatureUnit(e.target.value as any)}
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Assistant */}
      {activeTab === "assistant" && (
        <div className="card space-y-5">
          <div className="border-b border-primary-100 pb-3">
            <h2 className="text-base font-semibold text-primary-900">Annapoorna AI Companion</h2>
            <p className="text-xs text-primary-500">Fine-tune how your agricultural AI companion communicates and reasons.</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="label">Response Style</label>
              <select
                className="input"
                value={assistantStyle}
                onChange={(e) => setAssistantStyle(e.target.value as any)}
              >
                <option value="balanced">Balanced (Standard agronomic advice with rationale)</option>
                <option value="concise">Concise (Fast, direct, checklist-style answers)</option>
                <option value="detailed">Detailed (In-depth background, alternatives, and prevention)</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFarmContext}
                  onChange={(e) => setAutoFarmContext(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-semibold text-primary-900">
                    Automatically use active farm/crop context in conversations
                  </span>
                  <p className="text-xs text-primary-500 mt-0.5">
                    When enabled, the assistant automatically knows your current crop stage, irrigation schedule, and recent weather. When disabled, the assistant defaults to General Mode unless selected.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="card space-y-5">
          <div className="border-b border-primary-100 pb-3">
            <h2 className="text-base font-semibold text-primary-900">Notification Preferences</h2>
            <p className="text-xs text-primary-500">Manage alerts and advisory reminders generated by the platform.</p>
          </div>

          <div className="space-y-3 max-w-lg">
            {[
              {
                label: "Weather & Rain Advisories",
                desc: "Alerts for sudden rain forecasts, high disease risk conditions, or optimal spraying windows.",
                checked: notifWeather,
                setter: setNotifWeather,
              },
              {
                label: "Crop Task Reminders",
                desc: "Reminders for scheduled irrigation, fertilization, and weeding tasks.",
                checked: notifTasks,
                setter: setNotifTasks,
              },
              {
                label: "Crop Health & Inspection Alerts",
                desc: "Follow-up monitoring reminders after running a Crop Doctor diagnosis.",
                checked: notifCropHealth,
                setter: setNotifCropHealth,
              },
              {
                label: "Harvest & Sales Reminders",
                desc: "Notifications for expected harvest dates and unsold harvest inventory.",
                checked: notifHarvest,
                setter: setNotifHarvest,
              },
              {
                label: "Government Scheme Deadlines",
                desc: "Updates on eligible central and state agricultural subsidy schemes.",
                checked: notifSchemes,
                setter: setNotifSchemes,
              },
              {
                label: "Market Mandi Price Alerts",
                desc: "Notable price changes for your active crops in nearby APMC mandis.",
                checked: notifMarket,
                setter: setNotifMarket,
              },
            ].map((n, idx) => (
              <label key={idx} className="flex items-start gap-3 rounded-xl border border-primary-100 p-3 hover:bg-primary-50/50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={n.checked}
                  onChange={(e) => n.setter(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-semibold text-primary-900">{n.label}</span>
                  <p className="text-xs text-primary-500 mt-0.5">{n.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Account & Security */}
      {activeTab === "account" && (
        <div className="card space-y-6">
          <div className="border-b border-primary-100 pb-3">
            <h2 className="text-base font-semibold text-primary-900">Account & Security</h2>
            <p className="text-xs text-primary-500">Manage profile identity, credentials, and authentication sessions.</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Farmer name"
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                disabled
                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                value={profile?.email || authUser?.email || ""}
              />
              <p className="mt-1 text-[11px] text-primary-400">
                Authentication email is managed securely via Neon Auth.
              </p>
            </div>

            <div className="border-t border-primary-100 pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-primary-900">Security Credentials</h3>
              <p className="text-xs text-primary-500">
                You can request a secure OTP reset for your password at any time.
              </p>
              <a
                href="/forgot-password"
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition"
              >
                <KeyRound className="h-3.5 w-3.5" /> Reset Password via OTP
              </a>
            </div>

            <div className="border-t border-primary-100 pt-4">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
