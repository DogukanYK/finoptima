"use client";

// AI sohbet geçmişinin tarayıcıda kullanıcıya özel saklanması.
// Anahtar deseni: "<taban>:<userId>". Kullanıcı kimliği bilinmeden hiçbir şey
// okunmaz/yazılmaz — paylaşılan bilgisayarda ikinci kullanıcı birincinin
// sohbetini görmemeli (KVKK). Kimlik çözülür çözülmez, bu kullanıcıya ait
// olmayan (ve kimliksiz eski sürümden kalan) anahtarlar silinir.

import { useEffect, useState } from "react";

// Sohbet geçmişi tutan bileşenlerin anahtar tabanları.
export const CHAT_STORAGE_BASES = [
  "finoptima-chat-v1",
  "finoptima-support-chat-v1",
] as const;

export type ChatStorageBase = (typeof CHAT_STORAGE_BASES)[number];

function isChatKey(key: string) {
  return CHAT_STORAGE_BASES.some(
    (base) => key === base || key.startsWith(`${base}:`),
  );
}

// Mevcut kullanıcıya ait olmayan tüm sohbet anahtarlarını siler.
// Kimliksiz eski anahtarlar (v1 öncesi) taşınmaz, SİLİNİR — başka kullanıcıya
// ait olabilirler.
export function pruneForeignChatStorage(userId: string | null) {
  try {
    const mine = new Set(
      userId ? CHAT_STORAGE_BASES.map((base) => `${base}:${userId}`) : [],
    );
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !isChatKey(key) || mine.has(key)) continue;
      doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* localStorage erişilemiyor — yok say */
  }
}

// Çıkışta çağrılır: kime ait olursa olsun tüm sohbet geçmişini siler.
export function clearAllChatStorage() {
  pruneForeignChatStorage(null);
}

// Oturumdaki kullanıcı kimliği. Uygulamada SessionProvider yok, bu yüzden
// NextAuth'un session uç noktası doğrudan okunuyor.
async function fetchSessionUserId(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const session = (await res.json()) as { user?: { id?: string } } | null;
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// Bileşenlerin kullandığı anahtar: kimlik çözülene kadar null döner,
// bu sırada yabancı anahtarlar temizlenir.
export function useChatStorageKey(base: ChatStorageBase): string | null {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchSessionUserId().then((userId) => {
      if (!active) return;
      pruneForeignChatStorage(userId);
      setKey(userId ? `${base}:${userId}` : null);
    });
    return () => {
      active = false;
    };
  }, [base]);

  return key;
}
