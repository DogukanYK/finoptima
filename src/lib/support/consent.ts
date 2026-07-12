// KVKK kademeli erişim — consent (izin) yardımcıları.
// Geçerlilik OKUMA ANINDA zorlanır: ACTIVE && expiresAt > now && doğru ticket.
// (Faz 3 cron'u yalnız hijyen: süresi geçmiş satırları EXPIRED'a çevirir.)

import { db } from "@/lib/db";

// Kullanıcının verebileceği izin kapsamları (Tier 2 panelleri bunlara bağlı).
export const CONSENT_SCOPES = [
  "transactions",
  "debts",
  "findeks",
  "dashboard",
] as const;
export type ConsentScope = (typeof CONSENT_SCOPES)[number];

// Süre seçenekleri (saat) — kullanıcı thread'deki karttan seçer.
export const CONSENT_HOURS = [24, 48, 72] as const;

export type ActiveConsent = {
  id: string;
  ticketId: string;
  userId: string;
  scopes: string[];
  grantedAt: string; // ISO
  expiresAt: string; // ISO
};

// Bir ticket için ŞU AN geçerli izni döndürür (yoksa null).
// Süre kontrolü sorguda: expiresAt > now — durum ACTIVE olsa bile süresi
// geçmişse dönmez (okuma anında zorlanan geçerlilik).
export async function getActiveConsent(
  ticketId: string,
): Promise<ActiveConsent | null> {
  const consent = await db.supportConsent.findFirst({
    where: {
      ticketId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { grantedAt: "desc" },
  });
  if (!consent) return null;
  return {
    id: consent.id,
    ticketId: consent.ticketId,
    userId: consent.userId,
    scopes: consent.scopes,
    grantedAt: consent.grantedAt.toISOString(),
    expiresAt: consent.expiresAt.toISOString(),
  };
}

export function hasScope(
  consent: ActiveConsent | null,
  scope: ConsentScope,
): boolean {
  return Boolean(consent && consent.scopes.includes(scope));
}
