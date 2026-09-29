"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Image as ImageIcon, Mic, MicOff, Loader2, Trash2, Volume2 } from "lucide-react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import type { ChatMessageT, ChatSessionT } from "@/lib/types";

const QUICK_ACTIONS = ["Today's weather", "Should I irrigate?", "Today's tasks", "Check crop health", "My expenses", "Relevant schemes"];

export default function AssistantPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();
  const [sessions, setSessions] = useState<ChatSessionT[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string | null }[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check voice support on mount
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  function loadSessions() {
    api.get<ChatSessionT[]>("/chat/sessions").then((s) => {
      setSessions(s);
      if (!activeSessionId && s.length > 0) setActiveSessionId(s[0].id);
    });
  }
  useEffect(loadSessions, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    api.get<ChatMessageT[]>(`/chat/sessions/${activeSessionId}/messages`).then(setMessages);
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  async function newChat() {
    const session = await api.post<ChatSessionT>("/chat/sessions", { farm_id: selectedFarm?.id || null });
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
  }

  async function deleteChat(sid: string) {
    await api.delete(`/chat/sessions/${sid}`);
    setSessions((prev) => prev.filter((s) => s.id !== sid));
    if (activeSessionId === sid) setActiveSessionId(null);
  }

  async function sendMessage(text: string) {
    if (!text.trim() && !pendingImage) return;
    let sid = activeSessionId;
    if (!sid) {
      const session = await api.post<ChatSessionT>("/chat/sessions", { farm_id: selectedFarm?.id || null });
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
      setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, session_id: sid!, role: "user", content: text, image_url: imageUrl || null, created_at: new Date().toISOString() }]);
      setInput("");
      setPendingImage(null);
      const reply = await api.post<{ message: ChatMessageT; sources: any[] }>(`/chat/sessions/${sid}/messages`, { content: text, image_url: imageUrl });
      setMessages((prev) => [...prev, reply.message]);
      setSources(reply.sources || []);
      loadSessions();
    } catch (e: any) {
      const errorMsg = e?.status === 401
        ? "Your session has expired. Please sign in again."
        : e?.message?.includes("fetch")
        ? "Backend could not be reached."
        : "AI service is temporarily unavailable. Please try again.";
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, session_id: sid!, role: "assistant", content: errorMsg, image_url: null, created_at: new Date().toISOString() }]);
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 md:h-[calc(100vh-3.5rem)]">
      <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-primary-100 pr-3 sm:flex">
        <button onClick={newChat} className="btn-secondary mb-3 w-full"><Plus className="h-4 w-4" /> New chat</button>
        {sessions.map((s) => (
          <div key={s.id} className={`group mb-1 flex items-center rounded-lg px-2 py-2 text-sm ${activeSessionId === s.id ? "bg-primary-100 text-primary-900" : "text-primary-600 hover:bg-primary-50"}`}>
            <button onClick={() => setActiveSessionId(s.id)} className="flex-1 truncate text-left">{s.title}</button>
            <button onClick={() => deleteChat(s.id)} className="hidden text-primary-400 group-hover:block"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-primary-100 pb-3">
          <h1 className="text-lg font-semibold text-primary-900">Annapoorna AI</h1>
          {selectedFarm && <p className="text-xs text-primary-500">Context: {selectedFarm.name}</p>}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-4">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button key={qa} onClick={() => sendMessage(qa)} className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50">{qa}</button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={m.role === "user" ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm text-white" : "group max-w-[75%] rounded-2xl rounded-bl-sm bg-primary-50 px-4 py-2.5 text-sm text-primary-900"}>
                {m.image_url && <img src={m.image_url} alt="attachment" className="mb-1 max-h-48 rounded-lg" />}
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && m.content && (
                  <button
                    onClick={() => speakText(m.content)}
                    className="mt-1 hidden text-primary-400 hover:text-primary-600 group-hover:inline-flex"
                    aria-label="Read response aloud"
                    title="Read response"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && <div className="flex items-center gap-2 text-xs text-primary-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...</div>}
          {voiceError && <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{voiceError}</div>}
          {sources.length > 0 && <div className="rounded-lg bg-primary-50 p-2 text-xs text-primary-600">Sources: {sources.map((s) => s.title).join(", ")}</div>}
        </div>

        {pendingImage && <p className="text-xs text-primary-600">Attached: {pendingImage.name} <button onClick={() => setPendingImage(null)} className="underline">remove</button></p>}

        {listening && (
          <p className="text-xs text-primary-600 animate-pulse">🎙️ Listening... Speak now</p>
        )}

        <div className="flex items-center gap-2 border-t border-primary-100 pt-3">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setPendingImage(e.target.files?.[0] || null)} />
          <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2 text-primary-500 hover:bg-primary-50"><ImageIcon className="h-5 w-5" /></button>
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className={`rounded-lg p-2 ${listening ? "bg-red-100 text-red-600" : "text-primary-500 hover:bg-primary-50"}`}
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
            placeholder="Ask Annapoorna AI..."
            className="input flex-1"
          />
          <button onClick={() => sendMessage(input)} disabled={sending} className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
