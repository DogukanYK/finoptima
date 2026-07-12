"use client";

// "Yeni talep" — başlık satırı + inline açılır form paneli.
// Başarıda doğrudan talep detayına gider.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, SendHorizontal } from "lucide-react";
import { createSupportTicket } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";
import { Field, Label, FieldError, inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "OTHER", label: "Diğer" },
  { value: "ACCOUNT", label: "Hesap" },
  { value: "TRANSACTIONS", label: "İşlemler" },
  { value: "IMPORT", label: "Banka Dökümü" },
  { value: "FINDEKS", label: "Findeks" },
  { value: "DEBTS", label: "Borçlar" },
  { value: "SECURITY", label: "Güvenlik" },
  { value: "BUG", label: "Hata" },
];

export function NewTicketForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    if (subject.trim().length < 3) {
      setError("Konu en az 3 karakter olmalı.");
      return;
    }
    if (body.trim().length < 5) {
      setError("Mesaj en az 5 karakter olmalı.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createSupportTicket({
          subject: subject.trim(),
          category,
          body: body.trim(),
        });
        if (res.ok && res.id) {
          router.push(`/destek/${res.id}`);
        } else if (!res.ok) {
          setError(res.error);
        } else {
          setError("Talep oluşturulamadı. Tekrar dener misin?");
        }
      } catch {
        setError("Bir sorun oldu, tekrar dener misin?");
      }
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">Taleplerin</h2>
        <Button
          size="sm"
          variant={open ? "outline" : "primary"}
          onClick={() => {
            setOpen((v) => !v);
            setError("");
          }}
          data-new-ticket
        >
          {open ? <X size={15} /> : <Plus size={15} />}
          {open ? "Vazgeç" : "Yeni talep"}
        </Button>
      </div>

      {open && (
        <div className="card mt-4 space-y-4 p-5">
          <Field
            label="Konu"
            name="support-subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={160}
            placeholder="Kısaca sorunun ne?"
          />
          <Select
            label="Kategori"
            name="support-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <div>
            <Label htmlFor="support-body" required>
              Mesajın
            </Label>
            <textarea
              id="support-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Sorununu olabildiğince ayrıntılı anlat — ekran, adım, hata mesajı…"
              className={cn(inputClass, "h-auto min-h-[110px] resize-y py-2.5")}
            />
          </div>
          <FieldError message={error} />
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <SendHorizontal size={15} />
              )}
              Talebi gönder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
