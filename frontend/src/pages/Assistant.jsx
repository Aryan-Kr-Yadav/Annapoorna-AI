import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Volume2,
  Mic,
  MicOff,
  Tractor,
  Sprout,
  Compass,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  X,
  Sparkles,
  Bot,
  User,
  Paperclip,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import chatApi from "../api/chat";
import apiClient from "../api/client";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import MarkdownMessage from "../components/common/MarkdownMessage";
import { formatTime } from "../utils/formatters";
import { RotateCcw } from "lucide-react";

const QUICK_ACTIONS = [
  "Should I irrigate my active crop tomorrow?",
  "What fertilizer dose is needed for this stage?",
  "What health issues were found in recent inspections?",
  "What are today's market prices for my crop?",
  "Am I eligible for PM-KISAN or crop subsidies?",
];

export default function Assistant() {
  const { t } = useTranslation();
  const { farms, selectedFarm, selectFarm, crops, selectedCrop, selectCrop } = useFarms();

  const [contextMode, setContextMode] = useState("farm"); // 'farm' | 'general'
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sources, setSources] = useState([]);

  // Voice speech recognition
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognition);
    }
  }, []);

  // Manage image preview cleanup
  useEffect(() => {
    if (!pendingImage) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pendingImage]);

  const loadSessions = useCallback(async () => {
    try {
      const res = await chatApi.getSessions();
      const list = Array.isArray(res) ? res : [];
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0].id);
      }
    } catch {
      setSessions([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    chatApi.getMessages(activeSessionId).then((msgs) => {
      setMessages(Array.isArray(msgs) ? msgs : []);
    }).catch(() => setMessages([]));

    const sess = sessions.find((s) => s.id === activeSessionId);
    if (sess) {
      if (sess.farm_id) {
        setContextMode("farm");
        selectFarm(sess.farm_id);
        if (sess.crop_cycle_id) {
          selectCrop(sess.crop_cycle_id);
        }
      } else {
        setContextMode("general");
      }
    }
  }, [activeSessionId, sessions, selectFarm, selectCrop]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const createNewChat = async (mode = contextMode) => {
    const isFarm = mode === "farm" && selectedFarm;
    try {
      const session = await chatApi.createSession({
        farm_id: isFarm ? selectedFarm.id : null,
        crop_cycle_id: isFarm && selectedCrop ? selectedCrop.id : null,
        title: isFarm
          ? `Chat (${selectedFarm.name}${selectedCrop ? ` • ${selectedCrop.crop_name}` : ""})`
          : "General Farming Consultation",
      });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setSources([]);
    } catch (err) {
      alert("Failed to start new session: " + err.message);
    }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        setActiveSessionId(remaining[0]?.id || null);
      }
    } catch (err) {
      alert("Failed to delete session: " + err.message);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setImageError("Unsupported image format. Please upload JPG, PNG or WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image is too large (max 5MB). Please upload a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size === 0) {
      setImageError("Selected image file is empty (0 bytes).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageError(null);
    setPendingImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (textToSend, retryQuery = null) => {
    const rawContent = retryQuery !== null ? retryQuery : (textToSend !== undefined ? textToSend : input);
    if (!rawContent.trim() && !pendingImage) return;

    const isImageUpload = !!pendingImage;
    const contentToSend = rawContent.trim() || (isImageUpload ? "Analyze this crop image and describe visible agricultural observations." : "");

    let sid = activeSessionId;
    if (!sid) {
      const isFarm = contextMode === "farm" && selectedFarm;
      try {
        const session = await chatApi.createSession({
          farm_id: isFarm ? selectedFarm.id : null,
          crop_cycle_id: isFarm && selectedCrop ? selectedCrop.id : null,
          title: contentToSend.substring(0, 35) || "Agronomic inquiry",
        });
        setSessions((prev) => [session, ...prev]);
        sid = session.id;
        setActiveSessionId(sid);
      } catch (err) {
        alert("Failed to create session: " + err.message);
        return;
      }
    }

    setSending(true);
    const currentPreview = imagePreviewUrl;

    try {
      let imageUrl = null;
      if (pendingImage) {
        const form = new FormData();
        form.append("image", pendingImage);
        const uploaded = await apiClient.post("/uploads/image", form, true);
        imageUrl = uploaded?.url || currentPreview;
      }

      const tempUserMsg = {
        id: `temp-${Date.now()}`,
        session_id: sid,
        role: "user",
        content: contentToSend,
        image_url: imageUrl || currentPreview,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setInput("");
      handleRemoveImage();

      const reply = await chatApi.sendMessage(sid, {
        content: contentToSend,
        image_url: imageUrl,
      });

      if (reply?.message) {
        setMessages((prev) => [...prev, reply.message]);
      }
      setSources(reply?.sources || []);
      loadSessions();
    } catch (err) {
      let safeMsg = "Something went wrong while processing your request. Please try again.";
      if (err?.code === "RATE_LIMIT" || err?.status === 429) {
        safeMsg = "AI usage limit reached temporarily. Please try again shortly.";
      } else if (err?.code === "NETWORK_ERROR" || err?.status === 0) {
        safeMsg = "Unable to reach the Annapoorna AI service. Please check network connectivity.";
      } else if (err?.message && !err.message.includes("malformed")) {
        safeMsg = err.message;
      }

      const errReply = {
        id: `err-${Date.now()}`,
        session_id: sid,
        role: "assistant",
        content: safeMsg,
        image_url: null,
        created_at: new Date().toISOString(),
        isError: true,
        retryQuery: contentToSend,
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setSending(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // or "hi-IN"
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || "";
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Top Header & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Annapoorna Farm Intelligence Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Context-aware agricultural advisor with automated vision & reasoning.
          </p>
        </div>

        {/* Farm & Crop Context Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 p-1.5 dark:border-primary-900/40 dark:bg-primary-950/20">
          <button
            onClick={() => setContextMode("farm")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              contextMode === "farm"
                ? "bg-white text-primary-900 shadow-xs dark:bg-[#16241a] dark:text-primary-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Tractor className="h-3.5 w-3.5 text-primary-600" />
            <span>{t("assistant.farm_context", "Farm Context")}</span>
          </button>
          <button
            onClick={() => setContextMode("general")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              contextMode === "general"
                ? "bg-white text-primary-900 shadow-xs dark:bg-[#16241a] dark:text-primary-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-slate-500" />
            <span>{t("assistant.general_advice", "General Advice")}</span>
          </button>

          {contextMode === "farm" && selectedFarm && (
            <span className="hidden sm:inline-block border-l border-primary-200 pl-2 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-300">
              {selectedFarm.name} {selectedCrop ? `• ${selectedCrop.crop_name}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-12">
        {/* Left Sidebar: Chat Sessions */}
        <div className="hidden flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-[#1e3627] dark:bg-[#121c15] lg:col-span-3 lg:flex">
          <button
            onClick={() => createNewChat()}
            className="btn-primary w-full text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("assistant.new_consultation", "New Consultation")}
          </button>

          <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="p-3 text-center text-xs text-slate-400">No chat history yet.</p>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg p-2.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-primary-50 text-primary-900 dark:bg-primary-950/40 dark:text-primary-200"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Bot className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                      <span className="truncate">{sess.title || "Consultation"}</span>
                    </div>

                    <button
                      onClick={(e) => deleteSession(sess.id, e)}
                      className="opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Conversation & Input */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs dark:border-[#1e3627] dark:bg-[#121c15] lg:col-span-9 overflow-hidden">
          {/* Messages Scroll Area */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("assistant.welcome_title", "Namaste! How can I assist your farm today?")}
                </h3>
                <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                  {t("assistant.welcome_sub", "Ask questions regarding irrigation schedules, disease identification, weather stress, or market prices. Attach crop photos anytime.")}
                </p>

                {/* Quick Prompts */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                  {[
                    t("assistant.q1", "Should I irrigate my active crop tomorrow?"),
                    t("assistant.q2", "What fertilizer dose is needed for this stage?"),
                    t("assistant.q3", "What health issues were found in recent inspections?"),
                    t("assistant.q4", "What are today's market prices for my crop?"),
                    t("assistant.q5", "Am I eligible for PM-KISAN or crop subsidies?"),
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:border-primary-500 hover:bg-white hover:text-primary-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isUser
                          ? "bg-slate-800 text-white dark:bg-slate-700"
                          : "bg-primary-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-primary-600 text-white rounded-tr-none shadow-xs"
                          : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700/50 shadow-xs"
                      }`}
                    >
                      {m.image_url && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 max-w-xs">
                          <img
                            src={m.image_url}
                            alt="Crop inspection target"
                            className="max-h-52 w-full object-cover"
                          />
                        </div>
                      )}
                      
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MarkdownMessage content={m.content} />
                      )}

                      {m.isError && m.retryQuery && (
                        <div className="mt-3 pt-2 border-t border-red-200 dark:border-red-900/40">
                          <button
                            type="button"
                            onClick={() => sendMessage(undefined, m.retryQuery)}
                            disabled={sending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60 transition cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Retry inquiry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                <span>
                  {pendingImage ? "Analyzing crop photo with vision AI..." : "Annapoorna is evaluating agronomic knowledge..."}
                </span>
              </div>
            )}
          </div>

          {/* Image error warning */}
          {imageError && (
            <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <span>{imageError}</span>
              <button
                type="button"
                onClick={() => setImageError(null)}
                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 ml-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Image preview chip */}
          {imagePreviewUrl && (
            <div className="flex items-center gap-3 border-t border-slate-200 bg-emerald-50/60 px-4 py-2 dark:border-slate-800 dark:bg-emerald-950/20">
              <img src={imagePreviewUrl} alt="Preview" className="h-10 w-10 rounded-md object-cover border border-emerald-300 dark:border-emerald-800" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 block truncate">
                  {pendingImage?.name || "Photo attached"}
                </span>
                <span className="text-3xs text-emerald-700 dark:text-emerald-400">Ready for visual crop diagnosis</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition cursor-pointer"
                title="Remove Image"
              >
                <X className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* Bottom Input Controls */}
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                id="chat-image-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title={t("assistant.attach_photo", "Attach photo of leaf, pest, or field")}
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`rounded-lg p-2 transition ${
                    listening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title="Speak inquiry in English or Hindi"
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("assistant.placeholder", "Ask about fertilizer, pests, irrigation, schemes, or mandi rates...")}
                className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={sending || (!input.trim() && !pendingImage)}
                className="btn-primary rounded-xl px-4 py-2"
                title={t("assistant.send", "Send Query")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
