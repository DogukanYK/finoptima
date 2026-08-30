"use client";

// AI destek sohbeti — sayfa içi kart (drawer değil). assistant-panel deseninin
// sadeleştirilmiş hali: balonlar + öneri çipleri + localStorage kalıcılığı.
// AI escalate derse amber uyarı kartından tek tıkla insan desteğe aktarılır.

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  SendHorizontal,
  Loader2,
  Trash2,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { askSupportAI, escalateSupportChat } from "@/lib/actions/support";
import type { AssistantMessage } from "@/lib/assistant-types";
import { useChatStorageKey } from "@/lib/chat-storage";
import { cn } from "@/lib/utils";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  escalate?: boolean;
  suggestedCategory?: string | null;
  suggestedSubject?: string | null;
};

// Geçmiş kullanıcı bazında saklanır — "finoptima-support-chat-v1:<userId>"
const STORAGE_BASE = "finoptima-support-chat-v1";

const SUGGESTIONS = [
  "Ekstremi nasıl yüklerim?",
  "Kredi notum neden düşük görünüyor?",
  "2FA'yı nasıl açarım?",
  "Verilerimi nasıl silerim?",
];

let idCounter = 0;
const newId = () => `s${Date.now()}_${idCounter++}`;

export function SupportAiChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = useChatStorageKey(STORAGE_BASE);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  // localStorage'dan geçmişi yükle — kullanıcı kimliği çözülmeden okuma yok
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      /* bozuk kayıt — yok say */
      setMessages([]);
    }
    setHydratedKey(storageKey);
  }, [storageKey]);

  // geçmişi kaydet (son 30 mesaj) — yalnız kendi anahtarına
  useEffect(() => {
    if (!storageKey || hydratedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      /* kota — yok say */
    }
  }, [messages, storageKey, hydratedKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  const toHistory = (msgs: ChatMsg[]): AssistantMessage[] =>
    msgs.map((m) => ({ role: m.role, content: m.content }));

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setError("");
    setHint("");
    const history = toHistory(messages).slice(-10);
    setMessages((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setPending(true);
    try {
      const res = await askSupportAI(history, trimmed);
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: res.reply,
            escalate: res.escalate,
            suggestedCategory: res.suggestedCategory,
            suggestedSubject: res.suggestedSubject,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: res.error },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: "Bir sorun oldu, tekrar dener misin?",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const escalate = async (subject?: string | null, category?: string | null) => {
    if (escalating) return;
    if (messages.length === 0) {
      setHint(
        "Önce sorununu buraya yazabilirsin — ya da aşağıdaki “Yeni talep” butonuyla doğrudan talep aç.",
      );
      return;
    }
    setEscalating(true);
    setError("");
    try {
      const res = await escalateSupportChat({
        transcript: toHistory(messages),
        subject: (subject ?? "").trim() || "Destek talebi",
        category: category ?? undefined,
      });
      if (res.ok && res.id) {
        try {
          if (storageKey) localStorage.removeItem(storageKey);
        } catch {
          /* yok say */
        }
        window.location.href = "/destek/" + res.id;
        return;
      }
      setError(res.ok ? "Talep oluşturulamadı." : res.error);
    } catch {
      setError("Aktarma sırasında bir sorun oldu, tekrar dener misin?");
    }
    setEscalating(false);
  };

  const clearThread = () => {
    setMessages([]);
    setError("");
    setHint("");
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* yok say */
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="card p-0">
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
          style={{
            background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
          }}
        >
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">AI Destek</p>
          <p className="text-[11px] text-muted">
            Anında yanıt — gerekirse insan desteğe aktarır
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearThread}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-destructive"
          >
            <Trash2 size={13} />
            Temizle
          </button>
        )}
      </header>

      <div ref={scrollRef} className="max-h-[420px] space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !pending && (
          <div>
            <p className="text-sm text-muted">
              Sorununu yaz, hemen yardımcı olayım. Örnek sorular:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface-2 px-3.5 py-2 text-left text-sm text-ink transition-colors hover:border-primary/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            <div
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-ink",
                )}
              >
                {m.content}
              </div>
            </div>

            {m.role === "assistant" &&
              m.escalate &&
              lastAssistant?.id === m.id && (
                <div className="mt-2 rounded-[calc(var(--app-radius)*0.8)] border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="text-sm text-ink">
                    Bu konuda insan desteğin devreye girmesi daha iyi olur.
                    Sohbeti olduğu gibi ekibimize aktarabilirim.
                  </p>
                  <button
                    onClick={() => escalate(m.suggestedSubject, m.suggestedCategory)}
                    disabled={escalating}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  >
                    {escalating ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserRound size={15} />
                    )}
                    İnsana aktar
                    {m.suggestedSubject ? ` — ${m.suggestedSubject}` : ""}
                  </button>
                </div>
              )}
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-[calc(var(--app-radius)*0.9)] border border-line bg-surface-2 px-3 py-2 focus-within:border-primary/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Sorununu yaz… (örn. 'ekstre yüklerken hata alıyorum')"
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <button
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label="Gönder"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
            style={{
              background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
            }}
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <SendHorizontal size={16} />
            )}
          </button>
        </div>
        <button
          onClick={() => escalate(null, null)}
          disabled={escalating}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-primary disabled:opacity-50"
        >
          Çözülmedi mi? İnsan desteğe aktar
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
