"use client";

import { useRef, useState, useTransition } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  parseStatement,
  commitStatement,
  type ParsedRow,
} from "@/lib/actions/import";
import { formatTL, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type Account = { id: string; label: string; bankName: string; type: string };
type TxKind = "INCOME" | "EXPENSE" | "TRANSFER";

const KIND_LABEL: Record<TxKind, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
  TRANSFER: "Transfer",
};

export function ImportWizard({ accounts }: { accounts: Account[] }) {
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [fileName, setFileName] = useState("");
  const [detectedBank, setDetectedBank] = useState("");
  const [accountType, setAccountType] = useState<"DEBIT" | "CREDIT_CARD">(
    "DEBIT",
  );
  const [accountChoice, setAccountChoice] = useState<string>("__new__");
  const [newAccountLabel, setNewAccountLabel] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState({ imported: 0, skipped: 0 });
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState("");

  function analyze() {
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Lütfen bir dosya seç.");
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await parseStatement(fd);
      if (!res.ok || !res.rows) {
        setError(res.error ?? "Dosya çözümlenemedi.");
        return;
      }
      setRows(res.rows);
      setFileName(res.fileName ?? file.name);
      setDetectedBank(res.detectedBank ?? "");
      setAccountType(res.accountType ?? "DEBIT");
      setExcluded(
        new Set(
          res.rows.map((r, i) => (r.duplicate ? i : -1)).filter((i) => i >= 0),
        ),
      );
      // hesap seçimi varsayılanı
      const match = accounts.find(
        (a) =>
          res.detectedBank &&
          a.bankName.toLowerCase().includes(res.detectedBank.toLowerCase()) &&
          (res.accountType === "CREDIT_CARD"
            ? a.type === "CREDIT_CARD"
            : a.type !== "CREDIT_CARD"),
      );
      setAccountChoice(match ? match.id : "__new__");
      setNewAccountLabel(
        res.accountType === "CREDIT_CARD"
          ? `${res.detectedBank ?? "Banka"} Kredi Kartı`
          : `${res.detectedBank ?? "Banka"} Hesabı`,
      );
      setStage("preview");
    });
  }

  function commit() {
    const included = rows.filter((_, i) => !excluded.has(i));
    const isNew = accountChoice === "__new__";
    startTransition(async () => {
      const res = await commitStatement({
        bankName: detectedBank || "Diğer",
        accountId: isNew ? null : accountChoice,
        newAccount: isNew
          ? {
              label: newAccountLabel,
              type: accountType === "CREDIT_CARD" ? "CREDIT_CARD" : "CHECKING",
            }
          : null,
        fileName,
        rows: included,
      });
      if (res.ok) {
        setResult({ imported: res.imported, skipped: res.skipped });
        setStage("done");
      }
    });
  }

  function toggle(i: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function setKind(i: number, kind: TxKind) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, kind } : r)));
  }

  if (stage === "done") {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <CheckCircle2 size={48} className="text-accent" />
        <p className="mt-3 font-heading text-lg font-bold text-ink">
          İçe aktarma tamamlandı
        </p>
        <p className="mt-1 text-sm text-muted">
          {result.imported} işlem eklendi
          {result.skipped > 0 && `, ${result.skipped} tekrar atlandı`}.
        </p>
        <div className="mt-5 flex gap-2">
          <a
            href="/transactions"
            className="rounded-[calc(var(--app-radius)*0.75)] bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            İşlemleri gör
          </a>
          <button
            onClick={() => {
              setStage("upload");
              setRows([]);
              setPicked("");
            }}
            className="rounded-[calc(var(--app-radius)*0.75)] border border-line px-4 py-2.5 text-sm font-medium text-ink"
          >
            Yeni döküm
          </button>
        </div>
      </div>
    );
  }

  if (stage === "preview") {
    const includedCount = rows.length - excluded.size;
    const dupCount = rows.filter((r) => r.duplicate).length;
    return (
      <div className="space-y-4">
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <FileSpreadsheet size={22} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-muted">
              {detectedBank && `${detectedBank} · `}
              {accountType === "CREDIT_CARD" ? "Kredi kartı · " : ""}
              {rows.length} satır · {dupCount} tekrar
            </p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
            {includedCount} işlem
          </span>
        </div>

        {/* Hedef hesap */}
        <div className="card p-4">
          <label
            htmlFor="import-account"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Hedef hesap
          </label>
          <select
            id="import-account"
            value={accountChoice}
            onChange={(e) => setAccountChoice(e.target.value)}
            className="h-10 w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]"
          >
            <option value="__new__">+ Yeni hesap oluştur</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.bankName}
                {a.type === "CREDIT_CARD" ? " (kart)" : ""}
              </option>
            ))}
          </select>
          {accountChoice === "__new__" && (
            <input
              value={newAccountLabel}
              onChange={(e) => setNewAccountLabel(e.target.value)}
              placeholder="Hesap adı…"
              aria-label="Yeni hesap adı"
              className="mt-2 h-10 w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]"
            />
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="max-h-[440px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="p-2.5 font-medium">Ekle</th>
                  <th className="p-2.5 font-medium">Tarih</th>
                  <th className="p-2.5 font-medium">Açıklama</th>
                  <th className="p-2.5 font-medium">Tür</th>
                  <th className="p-2.5 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-line",
                      excluded.has(i) && "opacity-45",
                    )}
                  >
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={!excluded.has(i)}
                        onChange={() => toggle(i)}
                        aria-label={`${r.description} satırını içe aktar`}
                        className="h-4 w-4 accent-[var(--app-primary)]"
                      />
                    </td>
                    <td className="whitespace-nowrap p-2.5 tabular-nums text-muted">
                      {formatDateShort(r.date)}
                    </td>
                    <td className="max-w-[200px] truncate p-2.5 text-ink">
                      {r.description}
                      {r.duplicate && (
                        <span className="ml-1.5 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] text-warning">
                          tekrar
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <select
                        value={r.kind}
                        onChange={(e) => setKind(i, e.target.value as TxKind)}
                        aria-label={`${r.description} işlem türü`}
                        className="rounded-[calc(var(--app-radius)*0.45)] border border-line bg-surface px-1.5 py-1 text-xs text-ink outline-none focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]"
                      >
                        {(["EXPENSE", "INCOME", "TRANSFER"] as TxKind[]).map(
                          (k) => (
                            <option key={k} value={k}>
                              {KIND_LABEL[k]}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap p-2.5 text-right font-semibold tabular-nums",
                        r.kind === "INCOME"
                          ? "text-accent"
                          : r.kind === "TRANSFER"
                            ? "text-muted"
                            : "text-ink",
                      )}
                    >
                      {r.kind === "INCOME"
                        ? "+"
                        : r.kind === "TRANSFER"
                          ? "↔ "
                          : "−"}
                      {formatTL(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted">
          Transfer işlemleri (kart ödemesi, hesaplar arası) gelir-gider
          toplamlarına dahil edilmez. Türü yanlışsa satırdan düzeltebilirsin.
        </p>

        <div className="flex gap-2">
          <button
            onClick={commit}
            disabled={pending || includedCount === 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.75)] bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {includedCount} işlemi içe aktar
          </button>
          <button
            onClick={() => setStage("upload")}
            className="rounded-[calc(var(--app-radius)*0.75)] border border-line px-4 text-sm font-medium text-ink"
          >
            Geri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--app-radius)] border-2 border-dashed border-line py-10 text-center transition-colors hover:border-primary hover:bg-surface-2">
          <Upload size={26} className="text-primary" />
          <span className="text-sm font-medium text-ink">
            {picked || "Excel, CSV, PDF ya da ekran görüntüsü seç"}
          </span>
          <span className="text-xs text-muted">en fazla 10 MB</span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp,image/*"
            onChange={(e) => setPicked(e.target.files?.[0]?.name ?? "")}
            className="hidden"
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={analyze}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.75)] bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
          Dosyayı çözümle
        </button>
      </div>

      <div className="rounded-[var(--app-radius)] bg-surface-2 p-4 text-sm text-muted">
        <p className="font-medium text-ink">Desteklenen formatlar</p>
        <p className="mt-1">
          Excel/CSV, <strong>her bankanın</strong> PDF ekstresi ve fiş/ekstre{" "}
          <strong>ekran görüntüsü</strong>. Önce cihazda (offline) okunur; sistem
          okuyamazsa otomatik olarak yapay zekâya gönderilip sonuç alınır. Çok
          dilli; kategoriye ayırır, tekrarları eler, önizleme gösterir.
        </p>
      </div>
    </div>
  );
}
