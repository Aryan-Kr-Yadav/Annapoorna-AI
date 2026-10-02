import React, { useState, useEffect } from "react";
import {
  Globe,
  Tractor,
  Bot,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  LogOut,
  Sun,
  Moon,
  Monitor,
  User,
  Sprout,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import usersApi from "../api/users";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import Skeleton from "../components/common/Skeleton";

export default function Settings() {
  const { user: authUser, logout } = useAuth();
  const { farms, refreshFarms } = useFarms();
  const { language, setLanguage, t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("general");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [uiLanguage, setUiLanguage] = useState(language || "en");
  const [assistantLanguage, setAssistantLanguage] = useState("auto");
  const [defaultFarmId, setDefaultFarmId] = useState("");
  const [areaUnit, setAreaUnit] = useState("acre");
  const [temperatureUnit, setTemperatureUnit] = useState("celsius");
  const [assistantStyle, setAssistantStyle] = useState("balanced");

  // Notifications
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifCropHealth, setNotifCropHealth] = useState(true);
  const [notifSchemes, setNotifSchemes] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);

  useEffect(() => {
    setLoading(true);
    usersApi
      .getMe()
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name || "");
        const pref = data.preferences || {};
        const lang = pref.ui_language || data.preferred_language || language || "en";
        setUiLanguage(lang);
        setAssistantLanguage(pref.assistant_language || "auto");
        setDefaultFarmId(data.default_farm_id || pref.default_farm_id || "");
        setAreaUnit(pref.area_unit || "acre");
        setTemperatureUnit(pref.temperature_unit || "celsius");
        setAssistantStyle(pref.assistant_style || "balanced");

        if (pref.notifications) {
          setNotifWeather(pref.notifications.weather_alerts !== false);
          setNotifTasks(pref.notifications.task_reminders !== false);
          setNotifCropHealth(pref.notifications.crop_health_alerts !== false);
          setNotifSchemes(pref.notifications.scheme_updates !== false);
          setNotifMarket(pref.notifications.market_alerts !== false);
        }
      })
      .catch((err) => {
        setErrorMsg(err?.message || "Failed to load profile settings.");
      })
      .finally(() => setLoading(false));
  }, [language]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    const updatedPreferences = {
      ui_language: uiLanguage,
      assistant_language: assistantLanguage,
      default_farm_id: defaultFarmId || null,
      area_unit: areaUnit,
      temperature_unit: temperatureUnit,
      assistant_style: assistantStyle,
      notifications: {
        weather_alerts: notifWeather,
        task_reminders: notifTasks,
        crop_health_alerts: notifCropHealth,
        scheme_updates: notifSchemes,
        market_alerts: notifMarket,
      },
    };

    try {
      await usersApi.updateMe({
        full_name: fullName,
        preferred_language: uiLanguage,
        default_farm_id: defaultFarmId || null,
        preferences: updatedPreferences,
      });

      // Sync active language in UI
      setLanguage(uiLanguage);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t("settings.title", "Settings & Account Preferences")}
        subtitle="Manage interface localization, system theme, assistant personas, and farm units."
      />

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs sm:text-sm font-semibold">
        {[
          { id: "general", label: "General & Language", icon: Globe },
          { id: "appearance", label: "Appearance", icon: Sun },
          { id: "assistant", label: "Assistant AI", icon: Bot },
          { id: "farm", label: "Farm Preferences", icon: Tractor },
          { id: "notifications", label: "Alerts", icon: Bell },
          { id: "account", label: "Account", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB: GENERAL */}
        {activeTab === "general" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Interface Localization</h3>
            <p className="text-xs text-slate-500">
              Select the primary language for labels, menus, tables, and buttons across the platform.
            </p>

            <div>
              <label className="label">UI Language</label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setUiLanguage("en")}
                  className={`rounded-xl border p-3 text-left transition ${
                    uiLanguage === "en"
                      ? "border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950/40"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">English</span>
                  <span className="block text-xs text-slate-400">English (India)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUiLanguage("hi")}
                  className={`rounded-xl border p-3 text-left transition ${
                    uiLanguage === "hi"
                      ? "border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950/40"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">हिन्दी</span>
                  <span className="block text-xs text-slate-400">Hindi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: APPEARANCE */}
        {activeTab === "appearance" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Display Theme</h3>
            <p className="text-xs text-slate-500">
              Choose between clean warm agricultural light mode or sleek high-contrast forest dark mode.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                  theme === "light"
                    ? "border-primary-600 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-100"
                    : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                }`}
              >
                <Sun className="h-6 w-6 text-amber-500" />
                <span className="text-xs font-bold">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                  theme === "dark"
                    ? "border-primary-600 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-100"
                    : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                }`}
              >
                <Moon className="h-6 w-6 text-indigo-400" />
                <span className="text-xs font-bold">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                  theme === "system"
                    ? "border-primary-600 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-100"
                    : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                }`}
              >
                <Monitor className="h-6 w-6 text-slate-500" />
                <span className="text-xs font-bold">System Default</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: ASSISTANT */}
        {activeTab === "assistant" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Annapoorna AI Assistant Configuration</h3>
            <p className="text-xs text-slate-500">
              Customize language, communication length, and reasoning style for farm consultations.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Assistant Response Language</label>
                <select
                  value={assistantLanguage}
                  onChange={(e) => setAssistantLanguage(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="auto">Auto-detect from inquiry</option>
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="hinglish">Hinglish (Conversational)</option>
                </select>
              </div>

              <div>
                <label className="label">Response Depth & Style</label>
                <select
                  value={assistantStyle}
                  onChange={(e) => setAssistantStyle(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="concise">Concise (Action-oriented bullet points)</option>
                  <option value="balanced">Balanced (Recommended agronomic context)</option>
                  <option value="detailed">Detailed (Comprehensive agronomic breakdown)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FARM PREFERENCES */}
        {activeTab === "farm" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Farm Units & Defaults</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Default Farm</label>
                <select
                  value={defaultFarmId}
                  onChange={(e) => setDefaultFarmId(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="">None (Use first farm)</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Land Area Measurement Unit</label>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="acre">Acres (Standard)</option>
                  <option value="hectare">Hectares</option>
                  <option value="bigha">Bigha</option>
                </select>
              </div>

              <div>
                <label className="label">Temperature Unit</label>
                <select
                  value={temperatureUnit}
                  onChange={(e) => setTemperatureUnit(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Push & In-App Notification Preferences</h3>

            <div className="space-y-3">
              {[
                {
                  id: "weather",
                  label: "Severe Weather Alerts & Rain Advisories",
                  desc: "Early warnings for heavy rainfall, heatwaves, frost, and high winds.",
                  checked: notifWeather,
                  setter: setNotifWeather,
                },
                {
                  id: "tasks",
                  label: "Task Reminders & Scheduled Operations",
                  desc: "Morning reminders for fertilization, spraying, or weeding tasks.",
                  checked: notifTasks,
                  setter: setNotifTasks,
                },
                {
                  id: "crop_health",
                  label: "Crop Health & Inspection Follow-ups",
                  desc: "Follow-up reminders after registering pathology inspections.",
                  checked: notifCropHealth,
                  setter: setNotifCropHealth,
                },
                {
                  id: "schemes",
                  label: "Government Schemes & Subsidy Deadlines",
                  desc: "Notifications when matching Central or State subsidies open.",
                  checked: notifSchemes,
                  setter: setNotifSchemes,
                },
                {
                  id: "market",
                  label: "Mandi Price Alerts",
                  desc: "Weekly modal price updates for your active crops.",
                  checked: notifMarket,
                  setter: setNotifMarket,
                },
              ].map((item) => (
                <label key={item.id} className="flex items-start gap-3 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ACCOUNT */}
        {activeTab === "account" && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Information</h3>

            <div className="space-y-3 max-w-md">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="label">Registered Email</label>
                <input
                  type="email"
                  value={authUser?.email || profile?.email || ""}
                  disabled
                  className="input bg-slate-50 text-slate-500 text-xs sm:text-sm dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out of Annapoorna AI
              </button>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs sm:text-sm"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
