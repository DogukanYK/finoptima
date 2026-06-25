// Denetim günlüğü — güvenlik ve finansal olayların değiştirilemez kaydı.
// Append-only: yalnız ekleme yapılır. Hata olsa bile uygulamayı asla bloklamaz.

import { headers } from "next/headers";
import { db } from "@/lib/db";

export type AuditEntry = {
  userId?: string | null;
  action: string; // "login.success" | "debt.create" | "automation.approve" ...
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      userAgent = h.get("user-agent") ?? null;
    } catch {
      /* headers() bağlamı yoksa yoksay */
    }

    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        ip,
        userAgent,
        metadata: entry.metadata as object | undefined,
      },
    });
  } catch {
    // Denetim günlüğü hatası kullanıcı işlemini ASLA engellememeli.
  }
}
