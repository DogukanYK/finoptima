// Hassas alan şifreleme — AES-256-GCM, uygulama katmanı.
// TC kimlik no, adres gibi KVKK kapsamındaki alanlar veritabanında şifreli tutulur.
// Anahtar: ENCRYPTION_KEY (base64, 32 bayt). Üret: openssl rand -base64 32

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

// Bir metni şifreler. Boş/null değerler olduğu gibi döner.
export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return plain ?? null;
  const key = getKey();
  if (!key) {
    // Güvenlik kontrolü sessizce düz metin saklamamalı — sesli hata ver.
    throw new Error("ENCRYPTION_KEY tanımlı değil veya 32 bayt değil.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

// Şifreli metni çözer. Şifresiz (eski) değerleri olduğu gibi döndürür.
export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // eski/şifresiz veri — geçişli uyum
  const key = getKey();
  if (!key) return value; // anahtar yoksa okumayı bloklama
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ct = raw.subarray(28);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return null; // bozuk/çözülemeyen veri
  }
}
