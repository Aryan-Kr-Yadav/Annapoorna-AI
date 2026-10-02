import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Image as ImageIcon,
  Mic,
  MicOff,
  Loader2,
  Volume2,
  Sparkles,
} from "lucide-react";
import chatApi from "../../api/chat";
import apiClient from "../../api/client";
import { useFarms } from "../../contexts/FarmContext";
import MarkdownMessage from "../common/MarkdownMessage";

const QUICK_ACTIONS = [
  "Should I irrigate today?",
  "Check crop disease risk",
  "Today's farm tasks",
  "Weather forecast summary",
  "Recent fertilizer doses",
];

export function FloatingAssistant() {
  const { selectedFarm, selectedCrop } = useFarms();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toolActivity, setToolActivity] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRec);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const session = await chatApi.createSession({
      farm_id: selectedFarm?.id || null,
      crop_cycle_id: selectedCrop?.id || null,
      title: "Quick Assistant Chat",
    });
    setSessionId(session.id);
    return session.id;
  };

  const [imageError, setImageError] = useState(null);

  const handleImageSelect = (file) => {
    if (!file) {
      setPendingImage(null);
      setImagePreview(null);
      setImageError(null);
      return;
    }
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
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (text) => {
    const rawContent = text !== undefined ? text : input;
    if (!rawContent.trim() && !pendingImage) return;

    const isImage = !!pendingImage;
    const contentToSend = rawContent.trim() || (isImage ? "Analyze this crop image and describe visible agricultural observations." : "");

    setSending(true);
    setToolActivity(isImage ? "Analyzing crop photo with vision AI..." : "Agronomic reasoning...");

    const currentPreview = imagePreview;

    try {
      const sid = await ensureSession();
      let imageUrl = null;

      if (pendingImage) {
        const form = new FormData();
        form.append("image", pendingImage);
        try {
          const uploaded = await apiClient.post("/uploads/image", form, true);
          imageUrl = uploaded?.url || currentPreview;
        } catch {
          imageUrl = currentPreview;
        }
      }

      const userMsg = {
        id: `usr-${Date.now()}`,
        role: "user",
        content: contentToSend,
        image_url: imageUrl || currentPreview,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      handleRemoveImage();

      const reply = await chatApi.sendMessage(sid, { content: contentToSend, image_url: imageUrl });
      if (reply?.message) {
        setMessages((prev) => [...prev, reply.message]);
      }
    } catch (err) {
      let safeMsg = "Something went wrong while processing your request. Please try again.";
      if (err?.code === "RATE_LIMIT" || err?.status === 429) {
        safeMsg = "AI usage limit reached temporarily. Please try again shortly.";
      } else if (err?.code === "NETWORK_ERROR" || err?.status === 0) {
        safeMsg = "Unable to reach the Annapoorna AI service. Please check network connectivity.";
      } else if (err?.message && !err.message.includes("malformed")) {
        safeMsg = err.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: safeMsg,
        },
      ]);
    } finally {
      setSending(false);
      setToolActivity(null);
    }
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    rec.interimResults = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const speakText = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open Annapoorna AI Assistant"
        className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Ask Annapoorna Assistant"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5.5 w-5.5" />}
      </button>

      {/* Popover Window */}
      {open && (
        <div className="fixed bottom-32 md:bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-primary-200 dark:border-primary-900/60 bg-white dark:bg-[#141d12] shadow-2xl overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-900/40 bg-primary-50/70 dark:bg-primary-950/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-primary-950 dark:text-primary-50">
                  Annapoorna Assistant
                </h3>
                <p className="text-3xs text-primary-600 dark:text-primary-400 font-medium truncate max-w-[190px]">
                  {selectedFarm ? `${selectedFarm.name}${selectedCrop ? ` • ${selectedCrop.crop_name}` : ""}` : "General Farm Assistant"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[220px] max-h-[300px]">
            {messages.length === 0 ? (
              <div className="py-6 text-center space-y-2.5">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Ask me anything about your crops, tasks, weather risk, or farm operations.
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_ACTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30 px-2.5 py-1 text-2xs font-semibold text-primary-800 dark:text-primary-300 hover:bg-primary-100 transition"
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
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        isUser
                          ? "bg-primary-600 text-white rounded-br-xs"
                          : "bg-stone-100 dark:bg-[#1f2b1c] text-stone-900 dark:text-stone-100 rounded-bl-xs border border-primary-50 dark:border-primary-950"
                      }`}
                    >
                      {m.image_url && (
                        <img
                          src={m.image_url}
                          alt="Uploaded attachment"
                          className="mb-2 max-h-36 rounded-lg object-cover border border-black/10 dark:border-white/10"
                        />
                      )}
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MarkdownMessage content={m.content} />
                      )}
                    </div>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakText(m.content)}
                        className="mt-1 flex items-center gap-1 text-3xs text-stone-400 hover:text-primary-600 transition"
                        title="Read aloud"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{toolActivity || "Analyzing..."}</span>
              </div>
            )}
          </div>

          {/* Image error warning */}
          {imageError && (
            <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50 px-3 py-1.5 text-2xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <span>{imageError}</span>
              <button
                type="button"
                onClick={() => setImageError(null)}
                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mx-3 mb-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg inline-block w-fit">
              <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="border-t border-primary-100 dark:border-primary-900/40 p-2.5 bg-white dark:bg-[#141d12]">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-stone-400 hover:text-primary-600 transition rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Attach photo"
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition ${
                    listening
                      ? "bg-red-50 text-red-600 animate-pulse"
                      : "text-stone-400 hover:text-primary-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                  title={listening ? "Stop listening" : "Voice input"}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask Annapoorna AI..."
                className="flex-1 bg-stone-50 dark:bg-[#1a2517] border border-primary-200 dark:border-primary-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              />

              <button
                type="button"
                disabled={sending || (!input.trim() && !pendingImage)}
                onClick={() => sendMessage()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingAssistant;
