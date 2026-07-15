"use client";

// Admin yanıt kutusu — tek textarea, üç eylem:
//  • Yanıtla → müşteriye giden AGENT mesajı
//  • İç not ekle → müşteri ASLA görmez (amber)
//  • AI taslak öner → taslağı textarea'ya doldurur, otomatik GÖNDERMEZ

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal, Sparkles, StickyNote } from "lucide-react";
import {
  adminReplyTicket,
  adminAddInternalNote,
  adminSuggestDraft,
} from "@/lib/actions/admin-support";
import { Button } from "@/components/ui/button";
import { MacroPicker } from "@/components/admin/macro-picker";
import type { MacroPlain } from "@/lib/support/macros";

type Busy = "reply" | "note" | "draft" | null;

export function AdminReplyBox({
  ticketId,
  macros = [],
}: {
  ticketId: string;
  macros?: MacroPlain[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [isPending, startTransition] = useTransition();

  // Seçilen makronun body'sini mevcut metnin SONUNA ekler (üzerine yazmaz).
  function appendMacro(macroBody: string) {
    setError(null);
    setBody((prev) => {
      const trimmed = prev.replace(/\s+$/, "");
      return trimmed ? `${trimmed}\n\n${macroBody}` : macroBody;
    });
  }

  function submit(kind: "reply" | "note") {
    if (isPending) return;
    if (!body.trim()) {
      setError(kind === "reply" ? "Yanıt boş olamaz." : "Not boş olamaz.");
      return;
    }
    setError(null);
    setBusy(kind);
    startTransition(async () => {
      const res =
        kind === "reply"
          ? await adminReplyTicket(ticketId, body)
          : await adminAddInternalNote(ticketId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(res.error);
      }
      setBusy(null);
    });
  }

  function suggestDraft() {
    if (isPending) return;
    setError(null);
    setBusy("draft");
    startTransition(async () => {
      const res = await adminSuggestDraft(ticketId);
      if (res.ok) setBody(res.draft);
      else setError(res.error);
      setBusy(null);
    });
  }

  return (
    <div className="card p-4">
      {macros.length > 0 && (
        <div className="mb-2.5">
          <MacroPicker
            macros={macros}
            onSelect={appendMacro}
            disabled={isPending}
          />
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Yanıtını yaz… (İç not olarak da kaydedebilirsin)"
        className="w-full resize-y rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface p-3.5 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]"
        disabled={isPending}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => submit("reply")}
          disabled={isPending || !body.trim()}
        >
          {busy === "reply" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <SendHorizontal size={15} />
          )}
          Yanıtla
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => submit("note")}
          disabled={isPending || !body.trim()}
          className="border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
        >
          {busy === "note" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <StickyNote size={15} />
          )}
          İç not ekle
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={suggestDraft}
          disabled={isPending}
          className="ml-auto text-primary"
        >
          {busy === "draft" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          AI taslak öner
        </Button>
      </div>
    </div>
  );
}
