"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  SendHorizontal,
  Plus,
  Check,
  Loader2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from "lucide-react";
import { askAssistant, commitAssistantAction } from "@/lib/actions/assistant";
import type { ProposedAction } from "@/lib/assistant-types";
import { formatTL, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ProposedAction[];
  navigate?: string | null;
};

const STORAGE_KEY = "finoptima-chat-v1";

const SUGGESTIONS = [
  "Bu ay ne kadar harcadım?",
  "Dün markete 350 lira verdim",
  "Kedimi veterinere götürdüm, 600 tl",
  "Kredi notumu nasıl yükseltirim?",
];

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Panel",
  "/transactions": "İşlemler",
  "/add": "Harcama Ekle",
  "/findeks": "Findeks",
  "/borclar": "Borçlar",
  "/calendar": "Takvim",
  "/import": "Banka Dökümü",
  "/receipts": "Fişler",
  "/profil": "Profil",
};
function routeLabel(href: string) {
  return ROUTE_LABELS[href] ?? (href.startsWith("/settings") ? "Ayarlar" : "İlgili sayfa");
}

let idCounter = 0;
const newId = () => `m${Date.now()}_${idCounter++}`;

export function AssistantPanel({
  open,
  onClose,
  seed,
  onSeedConsumed,
}: {
  open: boolean;
  onClose: () => void;
  seed?: string;
  onSeedConsumed: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);

  // localStorage'dan geçmişi yükle (bir kez)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* bozuk kayıt — yok say */
    }
    hydrated.current = true;
  }, []);

  // geçmişi kaydet (son 40 mesaj)
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* kota — yok say */
    }
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      setInput("");
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: trimmed },
      ]);
      setPending(true);
      try {
        const res = await askAssistant(history, trimmed);
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: res.reply,
            actions: res.actions,
            navigate: res.navigate,
          },
        ]);
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
    },
    [messages, pending],
  );

  // Paletten "asistana sor" ile gelen tohum mesajı
  useEffect(() => {
    if (open && seed && seed.trim()) {
      send(seed);
      onSeedConsumed();
    }
    // send/onSeedConsumed kasıtlı olarak dışarıda — yalnız seed değişince tetikle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  const clearThread = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* yok say */
    }
  };
  const goTo = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/40 transition-opacity lg:pointer-events-none lg:bg-transparent",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[95] flex w-full max-w-[420px] flex-col border-l border-line bg-surface shadow-[var(--app-shadow-lg)] transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="AI Asistan"
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{
              background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
            }}
          >
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">FinOptima Asistan</p>
            <p className="text-[11px] text-muted">Sor, anlat, senin için ekleyeyim</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearThread}
              aria-label="Sohbeti temizle"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-destructive"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && !pending && (
            <div className="pt-6">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{
                  background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
                }}
              >
                <Sparkles size={26} />
              </div>
              <p className="text-center text-sm text-muted">
                Harcamanı anlat, senin için ekleyeyim.
                <br />
                Ya da finansına dair bir şey sor.
              </p>
              <div className="mt-5 space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-[calc(var(--app-radius)*0.8)] border border-line bg-surface-2 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-primary/40"
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

              {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {m.actions.map((a, i) => (
                    <ActionCard key={`${m.id}-${i}`} action={a} />
                  ))}
                </div>
              )}

              {m.role === "assistant" && m.navigate && (
                <button
                  onClick={() => goTo(m.navigate!)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40"
                >
                  {routeLabel(m.navigate)} sayfasına git
                  <ArrowRight size={13} />
                </button>
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
        </div>

        <div className="shrink-0 border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-2 rounded-[calc(var(--app-radius)*0.9)] border border-line bg-surface-2 px-3 py-2 focus-within:border-primary/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Bir şey yaz…  (örn. 'öğle yemeği 180 tl')"
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
        </div>
      </aside>
    </>
  );
}

// Tek bir AI önerisi kartı — kullanıcı "Ekle"ye basınca sunucuda işleme çevrilir.
function ActionCard({ action }: { action: ProposedAction }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error" | "dismissed">("idle");
  const [error, setError] = useState("");
  const [savedCategory, setSavedCategory] = useState<string | null>(null);
  const isIncome = action.kind === "INCOME";

  const commit = async () => {
    setState("saving");
    setError("");
    try {
      const res = await commitAssistantAction(action);
      if (res.ok) {
        setSavedCategory(res.created.categoryName);
        setState("done");
      } else {
        setError(res.error);
        setState("error");
      }
    } catch {
      setError("Eklenemedi.");
      setState("error");
    }
  };

  if (state === "dismissed") return null;

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.8)] border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm">
        <Check size={16} className="shrink-0 text-primary" />
        <span className="text-ink">
          Eklendi · <b>{formatTL(action.amount)}</b> · {action.description}
          {savedCategory ? ` · ${savedCategory}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-[calc(var(--app-radius)*0.8)] border border-line bg-surface p-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isIncome
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-rose-500/10 text-rose-600",
          )}
        >
          {isIncome ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {action.description}
          </p>
          <p className="text-xs text-muted">
            {isIncome ? "Gelir" : "Gider"}
            {action.category ? ` · ${action.category}` : ""} ·{" "}
            {formatDateShort(action.date)}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 text-sm font-bold",
            isIncome ? "text-emerald-600" : "text-ink",
          )}
        >
          {isIncome ? "+" : ""}
          {formatTL(action.amount)}
        </p>
      </div>

      {state === "error" && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}

      <div className="mt-2.5 flex gap-2">
        <button
          onClick={commit}
          disabled={state === "saving"}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {state === "saving" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          Ekle
        </button>
        <button
          onClick={() => setState("dismissed")}
          disabled={state === "saving"}
          className="rounded-full border border-line px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
