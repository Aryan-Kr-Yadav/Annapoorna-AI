"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161f14] p-6 shadow-2xl border border-primary-100 dark:border-primary-800 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-primary-100 dark:border-primary-800 mb-4">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 hover:text-primary-700 dark:hover:text-primary-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
