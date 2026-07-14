"use client";

// Talep mesaj dizisi — optimistic gönderim + CANLI polling (manuel yenile yok).
// USER sağ mavi; AGENT/AI sol yüzey; SYSTEM ortada küçük gri satır.
//
// Polling kuralları:
//  · Sekme görünürken 6 sn; document.hidden ise DURUR (istek atılmaz).
//  · 5 dk yeni mesaj yoksa 20 sn'ye düşer (idle backoff); yeni mesajda 6 sn'ye döner.
//  · 429 (rate limit) → geçici 30 sn, kullanıcıya hata gösterilmez.
//  · Talep CLOSED ise polling durur.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SendHorizontal,
  Loader2,
  XCircle,
  Headset,
  Sparkles,
} from "lucide-react";
import { sendSupportMessage, closeSupportTicket } from "@/lib/actions/support";
import type { PlainTicketDetail, PlainSupportMessage } from "@/lib/support-core";
import type { ActiveConsent } from "@/lib/support/consent";
import { ConsentCard } from "@/components/support/consent-card";
import { cn } from "@/lib/utils";

const POLL_FAST = 6_000;
const POLL_IDLE = 20_000;
const POLL_RATE_LIMITED = 30_000;
const IDLE_AFTER = 5 * 60_000; // 5 dk yeni mesaj yoksa yavaşla

let idCounter = 0;
const tempId = () => `tmp${Date.now()}_${idCounter++}`;
const isTemp = (id: string) => id.startsWith("tmp");

export function SupportThread({ initial }: { initial: PlainTicketDetail }) {
  const [messages, setMessages] = useState<PlainSupportMessage[]>(initial.messages);
  const [status, setStatus] = useState(initial.status);
  const [consent, setConsent] = useState<ActiveConsent | null>(initial.consent);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [pollMs, setPollMs] = useState(POLL_FAST);
  const [hidden, setHidden] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const pollingRef = useRef(false);
  const lastNewAtRef = useRef(Date.now());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Yeni mesajda listenin en altına kaydır.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // İzin server'da değişince (grant/revoke → router.refresh) prop'tan senkronla.
  // Kimlik+bitiş anahtarı: her render'da yeni obje gelse de gereksiz set yok.
  const initialConsentKey = initial.consent
    ? `${initial.consent.id}:${initial.consent.expiresAt}`
    : "";
  useEffect(() => {
    setConsent(initial.consent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConsentKey]);

  const poll = useCallback(async () => {
    if (pollingRef.current || document.hidden) return;
    pollingRef.current = true;
    try {
      const real = messagesRef.current.filter((m) => !isTemp(m.id));
      const after =
        real.length > 0 ? real[real.length - 1].createdAt : initial.createdAt;

      const res = await fetch(
        `/api/support/tickets/${initial.id}/messages?after=${encodeURIComponent(after)}`,
      );

      // Rate limit → sessizce yavaşla, kullanıcıya hata gösterme.
      if (res.status === 429) {
        setPollMs(POLL_RATE_LIMITED);
        return;
      }
      if (!res.ok) return; // ağ/geçici hata: sessiz geç, bir sonraki tur dener

      const data: PlainTicketDetail = await res.json();
      const incoming = data.messages ?? [];

      const known = new Set(messagesRef.current.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));

      if (fresh.length > 0) {
        // Gerçek USER mesajı geldiyse aynı gövdeli optimistic (tmp) kaydı düş.
        const freshUserBodies = new Set(
          fresh.filter((m) => m.author === "USER").map((m) => m.body),
        );
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const add = fresh.filter((m) => !seen.has(m.id));
          const kept = prev.filter(
            (m) => !(isTemp(m.id) && freshUserBodies.has(m.body)),
          );
          return [...kept, ...add];
        });
        lastNewAtRef.current = Date.now();
        setPollMs(POLL_FAST);
      } else {
        setPollMs(
          Date.now() - lastNewAtRef.current > IDLE_AFTER ? POLL_IDLE : POLL_FAST,
        );
      }

      setStatus(data.status);
      setConsent(data.consent ?? null);
    } catch {
      // sessiz — canlı takip kullanıcıyı hata mesajıyla rahatsız etmemeli
    } finally {
      pollingRef.current = false;
    }
  }, [initial.id, initial.createdAt]);

  // Sekme görünürlüğü: gizliyken poll etme, geri dönünce hemen bir kez çek.
  useEffect(() => {
    const onVisibility = () => {
      const isHidden = document.hidden;
      setHidden(isHidden);
      if (!isHidden) void poll();
    };
    setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [poll]);

  // Polling döngüsü — aralık (pollMs) veya görünürlük değişince yeniden kurulur.
  useEffect(() => {
    if (hidden || status === "CLOSED") return;
    const id = setInterval(() => void poll(), pollMs);
    return () => clearInterval(id);
  }, [poll, pollMs, hidden, status]);

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
        // Aktivite var → hızlı tempoya dön ve gerçek kaydı hemen çek
        // (tmp, aynı gövdeli USER mesajı gelince ayıklanır).
        lastNewAtRef.current = Date.now();
        setPollMs(POLL_FAST);
        void poll();
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
  const live = !closed && !hidden;

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              live ? "animate-pulse bg-emerald-500" : "bg-zinc-400",
            )}
            aria-hidden
          />
          {closed ? "Takip kapalı" : "Canlı — yeni yanıtlar otomatik gelir"}
        </span>
        {!closed && (
          <button
            onClick={close}
            disabled={closing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
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

      <ConsentCard ticketId={initial.id} consent={consent} />

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
                    isTemp(m.id) && "opacity-70",
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
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
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
