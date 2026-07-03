import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, MessageSquareText, Sparkles, Info } from "lucide-react";
import UploadCard from "../components/UploadCard.jsx";
import { CROP_TYPES } from "../utils/constants.js";
import { validateImageFile, validateSymptoms } from "../utils/validators.js";
import { compressImage } from "../utils/imageCompression.js";
import { diagnoseImage, diagnoseSymptoms } from "../services/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../hooks/useToast.js";

const TABS = {
  IMAGE: "image",
  SYMPTOMS: "symptoms",
};

export default function DiagnosePage() {
  const [activeTab, setActiveTab] = useState(TABS.IMAGE);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropType, setCropType] = useState(CROP_TYPES[0]);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);

  const { language } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const handleFileSelect = useCallback(
    (selected) => {
      const error = validateImageFile(selected);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    },
    [toast]
  );

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleImageSubmit = async () => {
    if (!file) {
      toast.error("Please upload a crop image first.");
      return;
    }
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const diagnosis = await diagnoseImage(compressed, { cropType, language });
      navigate("/results", { state: { diagnosis, meta: { cropType, source: "image" } } });
    } catch (err) {
      toast.error(err.message || "Diagnosis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomSubmit = async () => {
    const error = validateSymptoms(symptoms);
    if (error) {
      toast.error(error);
      return;
    }
    setLoading(true);
    try {
      const diagnosis = await diagnoseSymptoms({ symptoms, cropType, language });
      navigate("/results", { state: { diagnosis, meta: { cropType, source: "symptoms" } } });
    } catch (err) {
      toast.error(err.message || "Diagnosis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Sparkles size={14} /> AI Crop Diagnosis
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          What's troubling your crop today?
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Upload a photo, or describe what you're seeing — our AI will do the rest.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        {/* Tabs */}
        <div className="flex rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-900">
          <button
            onClick={() => setActiveTab(TABS.IMAGE)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
              activeTab === TABS.IMAGE
                ? "bg-white text-emerald-700 shadow-card dark:bg-gray-800 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Camera size={16} /> Image Diagnosis
          </button>
          <button
            onClick={() => setActiveTab(TABS.SYMPTOMS)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
              activeTab === TABS.SYMPTOMS
                ? "bg-white text-emerald-700 shadow-card dark:bg-gray-800 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <MessageSquareText size={16} /> Symptom Diagnosis
          </button>
        </div>

        {/* Crop type selector — shared by both tabs */}
        <div className="mt-6">
          <label htmlFor="cropType" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Crop Type
          </label>
          <select
            id="cropType"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="input-field"
          >
            {CROP_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {activeTab === TABS.IMAGE ? (
            <div>
              <UploadCard onFileSelect={handleFileSelect} preview={preview} onClear={clearFile} />
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Info size={14} className="mt-0.5 shrink-0" />
                For best results: take the photo in daylight, focus closely on the affected leaves
                or stem, and avoid blurry or dark images.
              </div>
              <button
                onClick={handleImageSubmit}
                disabled={loading}
                className="btn-primary mt-6 w-full"
              >
                {loading ? "Analyzing Image..." : "Analyze Image"}
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="symptoms" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Describe the symptoms
              </label>
              <textarea
                id="symptoms"
                rows={6}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Example: Leaves have yellow spots and edges are curling."
                className="input-field resize-none"
                maxLength={1500}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{symptoms.length}/1500</p>
              <button
                onClick={handleSymptomSubmit}
                disabled={loading}
                className="btn-primary mt-4 w-full"
              >
                {loading ? "Analyzing Symptoms..." : "Analyze Symptoms"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
