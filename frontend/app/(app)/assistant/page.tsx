"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageT, ChatSessionT } from "@/lib/types";

const QUICK_ACTIONS = [
  "Should I irrigate my active crop tomorrow?",
  "What fertilizer dose is needed for this stage?",
  "What health issues were found in recent inspections?",
  "What are today's market prices for my crop?",
  "Am I eligible for PM-KISAN or crop subsidies?",
];

type ContextMode = "farm" | "general";

export default function AssistantPage() {
  const api = useApi();
  const { farms, selectedFarm, selectFarm, crops, selectedCrop, selectCrop } = useFarms();

  const [contextMode, setContextMode] = useState<ContextMode>("farm");
  const [sessions, setSessions] = useState<ChatSessionT[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Context dropdown states
  const [selectorOpen, setSelectorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check voice recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognition);
    }
  }, []);

  const loadSessions = useCallback(() => {
    api.get<ChatSessionT[]>("/chat/sessions").then((s) => {
      setSessions(s);
      if (s[0] && !activeSessionId) {
        setActiveSessionId(s[0].id);
      }
    });
  }, [api, activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages and sync context when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    api.get<ChatMessageT[]>(`/chat/sessions/${activeSessionId}/messages`).then(setMessages);

    // Sync session context if recorded
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session) {
      if (session.farm_id) {
        setContextMode("farm");
        selectFarm(session.farm_id);
        if (session.crop_cycle_id) {
          selectCrop(session.crop_cycle_id);
        }
      } else {
        setContextMode("general");
      }
    }
  }, [activeSessionId, sessions, selectFarm, selectCrop]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function newChat(targetMode: ContextMode = contextMode) {
    const isFarmMode = targetMode === "farm" && selectedFarm;
    const session = await api.post<ChatSessionT>("/chat/sessions", {
      farm_id: isFarmMode ? selectedFarm.id : null,
      crop_cycle_id: isFarmMode && selectedCrop ? selectedCrop.id : null,
      title: isFarmMode
        ? `Chat (${selectedFarm.name}${selectedCrop ? ` • ${selectedCrop.crop_name}` : ""})`
        : "General Farming Chat",
    });

    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
    setSources([]);
  }

  async function deleteChat(id: string) {
    await api.delete(`/chat/sessions/${id}`);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(sessions.find((s) => s.id !== id)?.id || null);
    }
  }

  async function updateSessionContext(newFarmId: string | null, newCropId: string | null) {
    if (!activeSessionId) return;
    try {
      await api.put(`/chat/sessions/${activeSessionId}`, {
        farm_id: newFarmId,
        crop_cycle_id: newCropId,
      });
      loadSessions();
    } catch {
      // Ignored
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() && !pendingImage) return;

    let sid = activeSessionId;
    if (!sid) {
      const isFarmMode = contextMode === "farm" && selectedFarm;
      const session = await api.post<ChatSessionT>("/chat/sessions", {
        farm_id: isFarmMode ? selectedFarm.id : null,
        crop_cycle_id: isFarmMode && selectedCrop ? selectedCrop.id : null,
        title: text.substring(0, 40),
      });
      setSessions((prev) => [session, ...prev]);
      sid = session.id;
      setActiveSessionId(sid);
    }

    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (pendingImage) {
        const form = new FormData();
        form.append("image", pendingImage);
        const uploaded = await api.post<{ url: string }>("/uploads/image", form, true);
        imageUrl = uploaded.url;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          session_id: sid!,
          role: "user",
          content: text,
          image_url: imageUrl || null,
          created_at: new Date().toISOString(),
        },
      ]);
      setInput("");
      setPendingImage(null);

      const reply = await api.post<{ message: ChatMessageT; sources: any[] }>(
        `/chat/sessions/${sid}/messages`,
        { content: text, image_url: imageUrl }
      );

      setMessages((prev) => [...prev, reply.message]);
      setSources(reply.sources || []);
      loadSessions();
    } catch (e: any) {
      const errorMsg =
        e?.status === 401
          ? "Your session has expired. Please sign in again."
          : e?.message?.includes("fetch")
          ? "Backend could not be reached."
          : "AI service is temporarily unavailable. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          session_id: sid!,
          role: "assistant",
          content: errorMsg,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission denied.");
      } else if (event.error === "no-speech") {
        setVoiceError("No speech detected. Try again.");
      } else {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function speakText(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4 md:h-[calc(100vh-6.5rem)]">
      {/* Sidebar: Conversation history */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-primary-100 pr-3 sm:flex">
        <button
          type="button"
          onClick={() => newChat(contextMode)}
          className="btn-primary mb-3 w-full inline-flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="h-4 w-4" /> New Conversation
        </button>

        <div className="space-y-1">
          {sessions.map((s) => {
            const isActive = activeSessionId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition cursor-pointer",
                  isActive
                    ? "bg-primary-100/90 text-primary-950 font-bold shadow-2xs"
                    : "text-primary-700 hover:bg-primary-50 hover:text-primary-900"
                )}
                onClick={() => setActiveSessionId(s.id)}
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate">{s.title}</p>
                  <p className="text-[10px] text-primary-500 font-normal">
                    {s.farm_id ? "🌾 Farm Context" : "🌐 General Mode"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(s.id);
                  }}
                  className="hidden text-primary-400 hover:text-red-600 group-hover:block transition"
                  title="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Context Control Header */}
        <div className="border-b border-primary-100 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h1 className="text-lg font-bold text-primary-950 flex items-center gap-2">
                <span>Annapoorna Assistant</span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-800">
                  Groq Qwen 27B
                </span>
              </h1>

              {/* Visual Context Indicator */}
              <div className="mt-1 flex items-center gap-2 text-xs">
                {contextMode === "farm" && selectedFarm ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                    <span>Using context:</span>
                    <strong className="underline underline-offset-2">
                      📍 {selectedFarm.name}
                    </strong>
                    {selectedCrop && (
                      <>
                        <span>•</span>
                        <strong>🌾 {selectedCrop.crop_name} ({selectedCrop.season})</strong>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="text-primary-600 font-medium">
                    🌐 General Mode (Answering agricultural and science concepts directly)
                  </span>
                )}
              </div>
            </div>

            {/* Context Switcher Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setContextMode("farm");
                  updateSessionContext(selectedFarm?.id || null, selectedCrop?.id || null);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                  contextMode === "farm"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "border border-primary-200 text-primary-700 hover:bg-primary-50"
                )}
              >
                Farm Mode
              </button>

              <button
                type="button"
                onClick={() => {
                  setContextMode("general");
                  updateSessionContext(null, null);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                  contextMode === "general"
                    ? "bg-primary-700 text-white shadow-2xs"
                    : "border border-primary-200 text-primary-700 hover:bg-primary-50"
                )}
              >
                General Mode
              </button>
            </div>
          </div>
        </div>

        {/* Message stream */}
        <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto py-4 pr-1">
          {messages.length === 0 && (
            <div className="space-y-4 my-auto py-6">
              <div className="text-center max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 text-white shadow-md">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-base font-bold text-primary-950">
                  How can I help your farm today?
                </h3>
                <p className="mt-1 text-xs text-primary-600">
                  {contextMode === "farm" && selectedFarm
                    ? `I have access to ${selectedFarm.name}'s weather, crop lifecycle, soil, tasks, and inspection history.`
                    : "Ask any agronomic, scientific, or crop cultivation question."}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa}
                    type="button"
                    onClick={() => sendMessage(qa)}
                    className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:border-primary-300 hover:bg-primary-50 shadow-2xs transition"
                  >
                    {qa}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "group max-w-[82%] rounded-2xl px-4 py-2.5 text-sm transition shadow-2xs",
                    isUser
                      ? "rounded-br-xs bg-primary-600 text-white"
                      : "rounded-bl-xs bg-white border border-primary-100 text-primary-950"
                  )}
                >
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt="attachment"
                      className="mb-2 max-h-56 rounded-xl border border-white/20 object-cover"
                    />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

                  {!isUser && m.content && (
                    <div className="mt-1.5 flex items-center justify-between border-t border-primary-50 pt-1 text-[11px] text-primary-400">
                      <span>Annapoorna AI</span>
                      <button
                        type="button"
                        onClick={() => speakText(m.content)}
                        className="rounded p-1 hover:bg-primary-50 hover:text-primary-700 transition"
                        aria-label="Read response aloud"
                        title="Read response aloud"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-primary-500 bg-white border border-primary-100 rounded-xl p-3 w-fit">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span>Analyzing agronomic context and reasoning...</span>
            </div>
          )}

          {voiceError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-600">
              {voiceError}
            </div>
          )}

          {sources.length > 0 && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-2 text-xs text-primary-700">
              <span className="font-semibold">Knowledge References:</span>{" "}
              {sources.map((s, idx) => (
                <span key={idx}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="underline font-medium">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                  {idx < sources.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {pendingImage && (
          <div className="flex items-center gap-2 py-1 text-xs text-primary-600 bg-primary-50 px-3 rounded-lg mb-2">
            <span>Attached: {pendingImage.name}</span>
            <button type="button" onClick={() => setPendingImage(null)} className="underline font-bold text-red-600">
              Remove
            </button>
          </div>
        )}

        {listening && (
          <div className="flex items-center gap-2 py-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 rounded-lg mb-2 animate-pulse">
            <span>🎙️ Listening in Hindi/English... Speak your query clearly.</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 border-t border-primary-100 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setPendingImage(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-primary-200 p-2 text-primary-600 hover:bg-primary-50 transition"
            title="Attach plant or field photo"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "rounded-xl border p-2 transition",
                listening
                  ? "border-red-300 bg-red-100 text-red-600 animate-pulse"
                  : "border-primary-200 text-primary-600 hover:bg-primary-50"
              )}
              aria-label={listening ? "Stop listening" : "Voice query"}
              title={listening ? "Stop listening" : "Speak your query"}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={
              contextMode === "farm" && selectedCrop
                ? `Ask about ${selectedCrop.crop_name} (irrigation, fertilizer, disease)...`
                : "Ask Annapoorna AI any farming question..."
            }
            className="input flex-1 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={sending || (!input.trim() && !pendingImage)}
            className="rounded-xl bg-primary-600 p-2.5 text-white hover:bg-primary-700 disabled:opacity-50 transition shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
