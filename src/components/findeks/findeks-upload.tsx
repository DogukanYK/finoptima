"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import {
  uploadFindeksReport,
  type FindeksUploadState,
} from "@/lib/actions/findeks";
import { SubmitButton } from "@/components/ui/submit-button";

export function FindeksUpload({ hasReport }: { hasReport: boolean }) {
  const [state, formAction] = useActionState<FindeksUploadState, FormData>(
    uploadFindeksReport,
    {},
  );
  const [picked, setPicked] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="card p-5">
      <h2 className="flex items-center gap-2.5 font-heading text-base font-bold text-ink">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(120deg,#2563EB,#0EA5E9)" }}
        >
          <FileText size={18} />
        </span>
        {hasReport ? "Findeks raporunu güncelle" : "Findeks raporunu yükle"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Findeks'ten indirdiğin Risk Raporu PDF'ini yükle; gerçek skorun,
        limitlerin ve kart verilerin buraya işlensin.
      </p>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[var(--app-radius)] border-2 border-dashed border-line p-4 transition-colors hover:border-primary hover:bg-surface-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Upload size={20} />
        </span>
        <span className="flex-1 truncate text-sm text-ink">
          {picked || "Findeks Risk Raporu PDF'i seç"}
        </span>
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".pdf"
          onChange={(e) => setPicked(e.target.files?.[0]?.name ?? "")}
          className="hidden"
        />
      </label>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="mt-3 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-accent-soft px-3 py-2.5 text-sm text-accent">
          <CheckCircle2 size={16} className="shrink-0" />
          Rapor içe aktarıldı.
        </div>
      )}

      <SubmitButton className="mt-3 w-full" size="md" pendingText="Yükleniyor…">
        Raporu içe aktar
      </SubmitButton>
    </form>
  );
}
