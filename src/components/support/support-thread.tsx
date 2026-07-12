"use client";

// Talep mesaj dizisi — optimistic gönderim + manuel "Yenile" (Faz 2'de polling).
// USER sağ mavi; AGENT/AI sol yüzey; SYSTEM ortada küçük gri satır.

import { useEffect, useRef, useState } from "react";
import {
  SendHorizontal,
  Loader2,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Headset,
  Sparkles,
} from "lucide-react";
import { sendSupportMessage, closeSupportTicket } from "@/lib/actions/support";
import type { PlainTicketDetail, PlainSupportMessage } from "@/lib/support-core";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

let idCounter = 0;
const tempId = () => `tmp${Date.now()}_${idCounter++}`;

export function SupportThread({ initial }: { initial: PlainTicketDetail }) {
  const [messages, setMessages] = useState<PlainSupportMessage[]>(initial.messages);
  const [status, setStatus] = useState(initial.status);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const lastRealISO = () => {
    const real = messages.filter((m) => !m.id.startsWith("tmp"));
    return real.length > 0 ? real[real.length - 1].createdAt : initial.createdAt;
  };

  const appendNew = (incoming: PlainSupportMessage[]) => {
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length > 0 ? [...prev, ...fresh] : prev;
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || status === "CLOSED") return;
    setError("");
    setInput("");
    setSending(true);

    // Optimistic append — hata olursa geri alınır.
    const optimistic: PlainSupportMessage = {
      id: tempId(),
      author: "USER",
      body: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await sendSupportMessage(initial.id, text);
      if (res.ok) {
        // Çözüldü sanılan talep kullanıcı yazınca yeniden açılır (çekirdek kuralı).
        if (status === "RESOLVED") setStatus("OPEN");
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(text);
        setError(res.error);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
      setError("Mesaj gönderilemedi, tekrar dener misin?");
    } finally {
      setSending(false);
    }
  };

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(
        `/api/support/tickets/${initial.id}/messages?after=${encodeURIComponent(lastRealISO())}`,
      );
      if (res.ok) {
        const data: PlainTicketDetail = await res.json();
        appendNew(data.messages);
        if (data.status) setStatus(data.status);
      } else {
        setError("Yenilenemedi, biraz sonra tekrar dene.");
      }
    } catch {
      setError("Yenilenemedi, biraz sonra tekrar dene.");
    } finally {
      setRefreshing(false);
    }
  };

  const close = async () => {
    if (closing || status === "CLOSED") return;
    if (!window.confirm("Talebi kapatmak istediğine emin misin?")) return;
    setClosing(true);
    setError("");
    try {
      const res = await closeSupportTicket(initial.id);
      if (res.ok) setStatus("CLOSED");
      else setError(res.error);
    } catch {
      setError("Talep kapatılamadı, tekrar dener misin?");
    } finally {
      setClosing(false);
    }
  };

  const closed = status === "CLOSED";

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : undefined} />
          Yenile
        </button>
        {!closed && (
          <button
            onClick={close}
            disabled={closing}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {closing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <XCircle size={13} />
            )}
            Talebi kapat
          </button>
        )}
      </div>

      {initial.consent && (
        <div className="flex items-center gap-2 border-b border-line bg-primary-soft px-4 py-2.5">
          <ShieldCheck size={15} className="shrink-0 text-primary" />
          <p className="text-xs text-ink">
            Detaylı veri erişim izni aktif —{" "}
            <b>{formatDate(initial.consent.expiresAt)}</b> tarihine kadar.
          </p>
        </div>
      )}

      <div ref={scrollRef} className="max-h-[520px] space-y-3 overflow-y-auto p-4">
        {messages.map((m) =>
          m.author === "SYSTEM" ? (
            <p
              key={m.id}
              className="mx-auto max-w-[90%] whitespace-pre-wrap text-center text-xs italic text-muted"
            >
              {m.body}
            </p>
          ) : (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.author === "USER" ? "justify-end" : "justify-start",
              )}
            >
              <div className="max-w-[85%]">
                {m.author !== "USER" && (
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-muted">
                    {m.author === "AI" ? (
                      <>
                        <Sparkles size={11} /> AI
                      </>
                    ) : (
                      <>
                        <Headset size={11} /> Destek
                      </>
                    )}
                  </p>
                )}
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                    m.author === "USER"
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-ink",
                  )}
                >
                  {m.body}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-line p-3">
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        {closed ? (
          <p className="py-1 text-center text-sm text-muted">
            Bu talep kapatıldı. Yeni bir sorun için yeni talep açabilirsin.
          </p>
        ) : (
          <div className="flex items-end gap-2 rounded-[calc(var(--app-radius)*0.9)] border border-line bg-surface-2 px-3 py-2 focus-within:border-primary/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Mesajını yaz…"
              className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Gönder"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizontal size={16} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
