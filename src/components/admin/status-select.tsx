"use client";

// Talep durumu değiştirici — seçim anında kaydeder; hata olursa geri alır.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminSetStatus } from "@/lib/actions/admin-support";
import { Select } from "@/components/ui/select";

const STATUSES = [
  ["OPEN", "Açık"],
  ["IN_PROGRESS", "İlgileniliyor"],
  ["WAITING_USER", "Yanıt bekleniyor"],
  ["RESOLVED", "Çözüldü"],
  ["CLOSED", "Kapalı"],
] as const;

export function StatusSelect({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await adminSetStatus(ticketId, next);
      if (res.ok) {
        router.refresh();
      } else {
        setValue(prev);
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <div className="relative">
        <Select
          label="Durum"
          name="status"
          value={value}
          onChange={onChange}
          disabled={isPending}
        >
          {STATUSES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
        {isPending && (
          <Loader2
            size={16}
            className="absolute bottom-3.5 right-9 animate-spin text-muted"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
