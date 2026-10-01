"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Image as ImageIcon, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import type { ChatMessageT } from "@/lib/types";

const QUICK_ACTIONS = [
  "Today's weather",
  "Should I irrigate?",
  "Today's tasks",
  "Check crop health",
  "My expenses",
  "Relevant schemes",
];

export function FloatingAssistant() {
  const api = useApi();
  const { selectedFarm } = useFarms();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string | null }[]>([]);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check voice support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const session = await api.post<{ id: string }>("/chat/sessions", {
      farm_id: selectedFarm?.id || null,
      crop_cycle_id: null,
    });
    setSessionId(session.id);
    return session.id;
  }

  async function sendMessage(text: string) {
    if (!text.trim() && !pendingImage) return;
    setSending(true);
    setToolActivity("Thinking...");
    try {
      const sid = await ensureSession();

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
          session_id: sid,
          role: "user",
          content: text,
          image_url: imageUrl || null,
          created_at: new Date().toISOString(),
        },
      ]);
      setInput("");
      setPendingImage(null);

      const reply = await api.post<{ message: ChatMessageT; tools_used: string[]; sources: any[] }>(
        `/chat/sessions/${sid}/messages`,
        { content: text, image_url: imageUrl }
      );
      setMessages((prev) => [...prev, reply.message]);
      setSources(reply.sources || []);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          session_id: sessionId || "",
          role: "assistant",
          content: e?.status === 401
            ? "Your session has expired. Please sign in again."
            : e?.status === 0 || e?.code === "NETWORK_ERROR" || e?.message?.includes("offline")
            ? "Backend server is offline or unreachable. Please verify the backend is running."
            : e?.message || "AI service is temporarily unavailable. Please try again.",
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      setToolActivity(null);
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
    recognition.lang = "en-IN"; // supports Hindi/Hinglish via English-India

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700 md:bottom-6"
        aria-label="Open Annapoorna AI assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-[#151e14] sm:inset-auto sm:bottom-6 sm:right-5 sm:h-[560px] sm:w-96 sm:rounded-2xl sm:border sm:border-primary-100 dark:sm:border-primary-800 sm:shadow-2xl">
      <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">Annapoorna AI</p>
          {selectedFarm && <p className="text-xs text-primary-500 dark:text-primary-400">{selectedFarm.name}</p>}
        </div>
        <button onClick={() => setOpen(false)} className="rounded-md p-1 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa}
                onClick={() => sendMessage(qa)}
                className="rounded-full border border-primary-200 dark:border-primary-800 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition"
              >
                {qa}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white"
                  : "group max-w-[80%] rounded-2xl rounded-bl-sm bg-primary-50 dark:bg-[#1f2b1d] px-3 py-2 text-sm text-primary-900 dark:text-primary-100"
              }
            >
              {m.image_url && <img src={m.image_url} alt="attachment" className="mb-1 max-h-40 rounded-lg" />}
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.content && (
                <button
                  onClick={() => speakText(m.content)}
                  className="mt-1 hidden text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 group-hover:inline-flex"
                  aria-label="Read response aloud"
                  title="Read response"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {toolActivity}
          </div>
        )}

        {voiceError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">{voiceError}</div>
        )}

        {sources.length > 0 && (
          <div className="rounded-lg bg-primary-50 dark:bg-primary-900/30 p-2 text-xs text-primary-600 dark:text-primary-300">
            Sources: {sources.map((s) => s.title).join(", ")}
          </div>
        )}
      </div>

      {pendingImage && (
        <div className="border-t border-primary-100 dark:border-primary-800 px-4 py-2 text-xs text-primary-600 dark:text-primary-400">
          Attached: {pendingImage.name}{" "}
          <button onClick={() => setPendingImage(null)} className="ml-1 underline">
            remove
          </button>
        </div>
      )}

      {listening && (
        <div className="border-t border-primary-100 dark:border-primary-800 px-4 py-2 text-xs text-primary-600 dark:text-primary-400 animate-pulse">
          🎙️ Listening... Speak now
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-primary-100 dark:border-primary-800 px-3 py-3 bg-white dark:bg-[#151e14]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setPendingImage(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40"
          aria-label="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            className={`rounded-lg p-2 ${listening ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400" : "text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40"}`}
            aria-label={listening ? "Stop listening" : "Voice input"}
            title={listening ? "Stop listening" : "Voice input"}
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
          placeholder="Kal wheat ko paani dena chahiye?"
          className="input flex-1"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={sending}
          className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
