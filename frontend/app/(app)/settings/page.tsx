"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";

export default function SettingsPage() {
  const api = useApi();
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<any>("/users/me").then((u) => setLanguage(u.preferred_language));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/users/me", { preferred_language: language });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">Settings</h1>
      <div className="card space-y-3">
        <label className="label">Preferred language</label>
        <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
        <p className="text-xs text-primary-500">
          Annapoorna AI also understands Hinglish naturally in chat, regardless of this setting.
        </p>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
        {saved && <p className="text-sm text-primary-600">Saved.</p>}
      </div>
    </div>
  );
}
