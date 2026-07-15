import { Laptop, MonitorSmartphone, Smartphone, Tablet } from "lucide-react";
import type { KnownDeviceRow } from "@/lib/security/devices";
import { formatDateShort } from "@/lib/format";
import { ForgetDeviceButton } from "@/components/settings/forget-device-button";

// Etikete göre kaba ikon seçimi ("Safari · iPhone" → telefon).
function deviceIcon(label: string) {
  if (/iPad|Tablet/i.test(label)) return Tablet;
  if (/iPhone|Android|iOS/i.test(label)) return Smartphone;
  if (/macOS|Windows|Linux|ChromeOS/i.test(label)) return Laptop;
  return MonitorSmartphone;
}

// Sunucu bileşeni — cihaz listesi. Yalnız "Kaldır" butonu client.
export function KnownDevices({ devices }: { devices: KnownDeviceRow[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <MonitorSmartphone size={20} />
        </span>
        <div>
          <h2 className="font-heading font-bold tracking-tight text-ink">
            Bilinen cihazlar
          </h2>
          <p className="mt-1 text-sm text-muted">
            Hesabına giriş yapılan cihazlar. Tanımadığın bir cihaz görürsen
            şifreni değiştir ve tüm oturumları kapat.
          </p>
        </div>
      </div>

      {devices.length === 0 ? (
        <p className="mt-4 rounded-[var(--app-radius)] bg-surface-2 p-4 text-center text-sm text-muted">
          Henüz kayıtlı cihaz yok.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--app-border)] border-t border-line">
          {devices.map((d) => {
            const Icon = deviceIcon(d.label);
            return (
              <li key={d.id} className="flex items-center gap-3 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Icon size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {d.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Son görülme: {formatDateShort(d.lastSeenAt)} · İlk görülme:{" "}
                    {formatDateShort(d.firstSeenAt)}
                    {d.lastIp ? ` · IP ${d.lastIp}` : ""}
                  </p>
                </div>

                <ForgetDeviceButton deviceId={d.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
