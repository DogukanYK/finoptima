"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ScanText,
  ReceiptText,
} from "lucide-react";
import {
  uploadReceipt,
  extractReceiptFromImage,
  type ReceiptActionState,
} from "@/lib/actions/receipts";
import { recognizeReceipt } from "@/lib/ocr/receiptOcr";
import { parseReceiptText } from "@/lib/ocr/parseReceiptText";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; kind: string };
type OcrStatus = "idle" | "running" | "cloud" | "done" | "error";

const today = () => new Date().toISOString().slice(0, 10);

export function ReceiptForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState<ReceiptActionState, FormData>(
    uploadReceipt,
    {},
  );
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [preview, setPreview] = useState("");
  const [ocr, setOcr] = useState<OcrStatus>("idle");
  const [saved, setSaved] = useState(false);

  // OCR ile ön-doldurulabilen alanlar (kontrollü).
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      setPreview("");
      setOcr("idle");
      setAmount("");
      setDescription("");
      setDate(today());
      if (fileRef.current) fileRef.current.value = "";
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2800);
      return () => clearTimeout(t);
    }
  }, [state]);

  async function cloudFallback(file: File) {
    setOcr("cloud");
    const fd = new FormData();
    fd.set("file", file);
    const res = await extractReceiptFromImage(fd);
    if (res.ok) {
      setAmount(res.amount);
      setDescription(res.description);
      setDate(res.date);
      setKind(res.kind);
      setOcr("done");
    } else {
      setOcr("error");
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setOcr("running");
    try {
      const text = await recognizeReceipt(file);
      const parsed = parseReceiptText(text);
      if (parsed.amount != null) {
        // Offline başarılı — fotoğraf cihazdan çıkmaz.
        setAmount(parsed.amount.toFixed(2).replace(".", ","));
        if (parsed.merchant) setDescription(parsed.merchant);
        if (parsed.date) setDate(parsed.date);
        setOcr("done");
        return;
      }
      // Offline okuyamadı → otomatik buluta.
      await cloudFallback(file);
    } catch {
      // Cihaz-içi OCR patladı → buluta dene.
      try {
        await cloudFallback(file);
      } catch {
        setOcr("error");
      }
    }
  }

  function clearPhoto() {
    setPreview("");
    setOcr("idle");
    if (fileRef.current) fileRef.current.value = "";
  }

  const kindCategories = categories.filter((c) => c.kind === kind);

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <input type="hidden" name="kind" value={kind} />

      {/* Fotoğraf — yalnız cihazda OCR için kullanılır, sunucuya gönderilmez */}
      {preview ? (
        <div className="relative h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Fiş önizlemesi"
            className="h-full w-full rounded-[var(--app-radius)] border border-line bg-surface-2 object-contain"
          />
          <button
            type="button"
            onClick={clearPhoto}
            aria-label="Fotoğrafı kaldır"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--app-radius)] border-2 border-dashed border-line py-12 text-center transition-colors hover:border-primary hover:bg-surface-2"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(120deg,#2563EB,#0EA5E9)" }}
          >
            <ReceiptText size={26} />
          </span>
          <span className="text-sm font-medium text-ink">
            Fiş fotoğrafı çek veya seç
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
            <Camera size={13} />
            Önce cihazda okunur; okunamazsa yapay zekâya gönderilir
          </span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />

      {/* OCR durumu */}
      {ocr === "running" && (
        <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft px-3 py-2.5 text-sm text-primary">
          <Loader2 size={16} className="shrink-0 animate-spin" />
          Fiş okunuyor… (cihazında işleniyor)
        </div>
      )}
      {ocr === "cloud" && (
        <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft px-3 py-2.5 text-sm text-primary">
          <Loader2 size={16} className="shrink-0 animate-spin" />
          Cihazda okunamadı — yapay zekâ ile okunuyor…
        </div>
      )}
      {ocr === "done" && (
        <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-accent-soft px-3 py-2.5 text-sm text-accent">
          <ScanText size={16} className="shrink-0" />
          Fiş okundu — bilgileri kontrol edip düzeltebilirsin.
        </div>
      )}
      {ocr === "error" && (
        <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-surface-2 px-3 py-2.5 text-sm text-muted">
          <AlertCircle size={16} className="shrink-0" />
          Otomatik okunamadı — bilgileri elle girebilirsin.
        </div>
      )}

      {/* Tür */}
      <div className="grid grid-cols-2 gap-2 rounded-[calc(var(--app-radius)*0.8)] bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setKind("EXPENSE")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.6)] py-2 text-sm font-semibold",
            kind === "EXPENSE" ? "bg-destructive text-white" : "text-muted",
          )}
        >
          <ArrowUpRight size={15} /> Gider
        </button>
        <button
          type="button"
          onClick={() => setKind("INCOME")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.6)] py-2 text-sm font-semibold",
            kind === "INCOME" ? "bg-accent text-white" : "text-muted",
          )}
        >
          <ArrowDownLeft size={15} /> Gelir
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <ScanText size={15} className="shrink-0 text-muted" />
        <span className="text-xs font-semibold text-muted">
          Çıkarılan bilgiler
        </span>
        <span className="h-px flex-1 bg-[var(--app-border)]" />
      </div>

      <Field
        name="amount"
        label="Tutar"
        placeholder="₺ 0,00"
        inputMode="decimal"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={state.fieldErrors?.amount}
      />
      <Field
        name="description"
        label="Açıklama"
        placeholder="Örn. A101 market"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={state.fieldErrors?.description}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select name="categoryId" label="Kategori" defaultValue="">
          <option value="">Otomatik seç</option>
          {kindCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Field
          name="date"
          type="date"
          label="Tarih"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton size="lg" className="w-full" pendingText="Kaydediliyor…">
        Fişi kaydet
      </SubmitButton>

      {saved && (
        <div className="flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-accent-soft py-2.5 text-sm font-medium text-accent">
          <CheckCircle2 size={17} /> Fiş kaydedildi
        </div>
      )}
    </form>
  );
}
