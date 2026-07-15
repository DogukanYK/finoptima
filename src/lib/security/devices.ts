// Cihaz tanıma — kullanıcının hesabına giriş yapılan cihazları takip eder.
//
// MUTLAK KURAL: buradaki hiçbir fonksiyon kimlik/giriş akışını bloklamaz veya
// patlatmaz. touchDevice() gövdesi baştan sona try/catch içindedir; DB hatası
// olsa bile kullanıcı girişi normal şekilde tamamlanır.
//
// deviceHash bir "parmak izi" değildir — yalnızca User-Agent'ın sha256'sıdır.
// Kaba bir cihaz kimliği: aynı tarayıcı+sürüm aynı hash'i üretir.

import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export type KnownDeviceRow = {
  id: string;
  label: string;
  lastIp: string | null;
  firstSeenAt: string; // ISO
  lastSeenAt: string; // ISO
};

// User-Agent'ı hash'lemeden önce sadeleştirir: baştaki/sondaki boşlukları
// atar, iç boşlukları teke indirir. Boş/eksik UA → "unknown".
function normalize(ua: string | null | undefined): string {
  const s = (ua ?? "").replace(/\s+/g, " ").trim();
  return s.length > 0 ? s : "unknown";
}

function hashUA(ua: string | null | undefined): string {
  return createHash("sha256")
    .update(normalize(ua))
    .digest("hex")
    .slice(0, 32);
}

// User-Agent'tan okunabilir etiket üretir: "Chrome · macOS", "Safari · iPhone".
// Harici kütüphane yok — kaba ama yeterli regex eşlemesi.
export function deviceLabel(ua: string | null | undefined): string {
  const s = (ua ?? "").trim();
  if (!s) return "Bilinmeyen cihaz";

  // FinOptima iOS uygulaması: URLSession varsayılan UA'sı
  // "FinOptima/1.0 CFNetwork/... Darwin/..." biçimindedir.
  if (/FinOptima/i.test(s)) return "FinOptima · iOS";
  if (/CFNetwork/i.test(s) && /Darwin/i.test(s)) return "FinOptima · iOS";

  // --- İşletim sistemi (önce mobil, sonra masaüstü) ---
  let os: string | null = null;
  if (/iPhone/i.test(s)) os = "iPhone";
  else if (/iPad/i.test(s)) os = "iPad";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Windows/i.test(s)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/CrOS/i.test(s)) os = "ChromeOS";
  else if (/Linux/i.test(s)) os = "Linux";

  // --- Tarayıcı (sıra önemli: Edge/Opera kendini Chrome gibi tanıtır,
  // Chrome da kendini Safari gibi tanıtır) ---
  let browser: string | null = null;
  if (/Edg[A-Z]?\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/SamsungBrowser/i.test(s)) browser = "Samsung Internet";
  else if (/YaBrowser/i.test(s)) browser = "Yandex";
  else if (/Firefox\/|FxiOS/i.test(s)) browser = "Firefox";
  else if (/CriOS/i.test(s)) browser = "Chrome";
  else if (/Chrome\//i.test(s)) browser = "Chrome";
  else if (/Safari\//i.test(s) && /Version\//i.test(s)) browser = "Safari";
  else if (/Safari\//i.test(s)) browser = "Safari";

  if (browser && os) return `${browser} · ${os}`;
  if (browser) return browser;
  if (os) return os;
  return "Bilinmeyen cihaz";
}

// Girişte çağrılır: cihazı kaydeder / son görülmeyi tazeler.
//
// isNew=true yalnızca kullanıcının DAHA ÖNCE en az bir cihazı varken
// tanınmayan bir cihaz geldiğinde döner — yani "yeni cihazdan giriş" uyarısı
// gönderilmesi gereken durum. İlk kayıt/ilk giriş (hiç cihazı yokken) cihazı
// kaydeder ama isNew=FALSE döner: zaten hoş geldin e-postası gidiyor.
export async function touchDevice(
  userId: string,
  ua: string | null,
  ip: string | null,
): Promise<{ isNew: boolean; label: string }> {
  const label = deviceLabel(ua);
  try {
    const deviceHash = hashUA(ua);

    const existing = await db.knownDevice.findUnique({
      where: { userId_deviceHash: { userId, deviceHash } },
    });

    if (existing) {
      await db.knownDevice.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date(), lastIp: ip ?? existing.lastIp },
      });
      return { isNew: false, label: existing.label };
    }

    // Tanınmayan cihaz. Kullanıcının hiç cihazı yoksa bu ilk giriştir.
    const deviceCount = await db.knownDevice.count({ where: { userId } });
    await db.knownDevice.create({
      data: { userId, deviceHash, label, lastIp: ip },
    });
    return { isNew: deviceCount > 0, label };
  } catch (err) {
    // Cihaz takibi giriş akışını ASLA bozmamalı.
    console.error("[devices] touchDevice başarısız:", err);
    return { isNew: false, label };
  }
}

// Kullanıcının cihazları — en son görülen en üstte.
export async function listDevices(userId: string): Promise<KnownDeviceRow[]> {
  try {
    const rows = await db.knownDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
    });
    return rows.map((d) => ({
      id: d.id,
      label: d.label,
      lastIp: d.lastIp,
      firstSeenAt: d.firstSeenAt.toISOString(),
      lastSeenAt: d.lastSeenAt.toISOString(),
    }));
  } catch (err) {
    console.error("[devices] listDevices başarısız:", err);
    return [];
  }
}

// Cihazı unut. userId eşleşmesi ZORUNLU — kimse başkasının cihazını silemez.
// Silinen satır sayısı 0 ise false döner (yanlış id / başkasının cihazı).
export async function forgetDevice(
  userId: string,
  deviceId: string,
): Promise<boolean> {
  try {
    const res = await db.knownDevice.deleteMany({
      where: { id: deviceId, userId },
    });
    return res.count > 0;
  } catch (err) {
    console.error("[devices] forgetDevice başarısız:", err);
    return false;
  }
}
