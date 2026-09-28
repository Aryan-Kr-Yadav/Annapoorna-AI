import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UploadCloud, ImageIcon, X } from "lucide-react";

export default function UploadCard({ onFileSelect, preview, onClear }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      if (files && files[0]) onFileSelect(files[0]);
    },
    [onFileSelect]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 dark:border-emerald-900">
        <img src={preview} alt="Crop preview" className="h-72 w-full object-cover sm:h-96" />
        <button
          onClick={onClear}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 shadow-card hover:bg-white dark:bg-gray-900/90 dark:text-gray-200"
          aria-label="Remove image"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      animate={{ scale: isDragging ? 1.01 : 1 }}
      className={`flex h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 text-center transition-colors sm:h-96 ${
        isDragging
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-700"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
        <UploadCloud size={28} />
      </div>
      <div>
        <p className="font-semibold text-gray-700 dark:text-gray-200">
          Drag &amp; drop your crop image here
        </p>
        <p className="mt-1 text-sm text-gray-400">or click to browse from your device</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ImageIcon size={14} />
        JPG, PNG, JPEG · up to 8MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </motion.div>
  );
}
