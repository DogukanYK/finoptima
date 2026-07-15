"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { forgetDeviceAction } from "@/lib/actions/devices";

// Cihaz satırındaki küçük "Kaldır" butonu — known-devices.tsx (server component)
// içinden kullanılır.
export function ForgetDeviceButton({ deviceId }: { deviceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    setError("");
    startTransition(async () => {
      const res = await forgetDeviceAction(deviceId);
      if (!res.ok) setError(res.error ?? "Kaldırılamadı.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        title="Bu cihazı kaldır"
        aria-label="Bu cihazı kaldır"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-destructive-soft hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
