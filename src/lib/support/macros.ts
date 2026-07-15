// Hazır yanıt makroları (SupportMacro) — CRUD + tembel-seed.
// GÜVENLİK: makro gövdeleri genel/yardımcı metinlerdir; finansal veri İÇERMEZ.
// Tüm fonksiyonlar plain (ISO tarihli) nesne döndürür — client'a güvenle geçilir.

import { db } from "@/lib/db";

export type MacroPlain = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MacroRow = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function toPlain(m: MacroRow): MacroPlain {
  return {
    id: m.id,
    title: m.title,
    body: m.body,
    category: m.category,
    sortOrder: m.sortOrder,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// Varsayılan makrolar — yalnız tablo boşken eklenir (idempotent, title'a göre).
// TÜRKÇE, yardımcı tonda; hiçbiri finansal veri içermez.
const DEFAULT_MACROS: { title: string; body: string; category: string }[] = [
  {
    title: "Ekstre yükleme hatası (parola)",
    category: "IMPORT",
    body: "Merhaba,\n\nBanka dökümünüzü yüklerken parola hatası alıyorsanız, PDF'iniz büyük olasılıkla parola korumalıdır. Lütfen dosyayı bankanızın uygulamasından parolasız (korumasız) olarak yeniden indirip tekrar deneyin. Alternatif olarak, PDF'i açtıktan sonra \"parolasız kopya olarak kaydet\" seçeneğiyle yeni bir dosya oluşturabilirsiniz.\n\nSorun sürerse dosyanın hangi bankaya ait olduğunu iletmeniz yeterli; birlikte çözelim.",
  },
  {
    title: "2FA sıfırlama",
    category: "SECURITY",
    body: "Merhaba,\n\nİki adımlı doğrulamaya (2FA) erişiminizi kaybettiyseniz, hesap güvenliğiniz için kimliğinizi doğruladıktan sonra 2FA'yı sıfırlıyoruz. Lütfen hesabınıza kayıtlı e-posta adresini ve son giriş yaptığınız cihazı belirtin. Doğrulama tamamlanınca 2FA'yı sıfırlayıp yeniden kurmanız için size adım adım yol göstereceğiz.\n\nGüvenliğiniz için bu işlemi yalnız hesap sahibiyle yapıyoruz.",
  },
  {
    title: "Findeks skoru neden tahmini",
    category: "FINDEKS",
    body: "Merhaba,\n\nUygulamada gösterilen skor, resmî Findeks kredi notunuzun bir kopyası değil; işlem ve borç verilerinize dayanan bir tahmindir. Amacı, kredi notunuzu etkileyen faktörler hakkında yön göstermektir. Resmî notunuz için Findeks'in kendi kanallarını kullanmanızı öneririz.\n\nTahminin nasıl hesaplandığına dair sorularınız olursa memnuniyetle açıklarız.",
  },
  {
    title: "Veri silme / KVKK talebi",
    category: "ACCOUNT",
    body: "Merhaba,\n\nKVKK kapsamındaki veri silme talebinizi aldık. Hesabınıza bağlı kişisel verilerin kalıcı olarak silinmesini talep ediyorsanız, işlemi hesap sahibi olarak onaylamanız gerekiyor. Talebinizi teyit etmeniz halinde verileriniz yasal saklama yükümlülükleri dışında kalan kısımlarıyla silinecektir; bu işlem geri alınamaz.\n\nDevam etmek istediğinizi yazmanız yeterli; süreci sizin için başlatalım.",
  },
];

// Yalnız tablo boşsa varsayılan makroları ekler. Admin makro sayfası açılınca
// çağrılır — prod build'ini etkilemez (migration'a konmaz). Idempotent.
export async function ensureDefaultMacros(): Promise<void> {
  const count = await db.supportMacro.count();
  if (count > 0) return;
  await db.supportMacro.createMany({
    data: DEFAULT_MACROS.map((m, i) => ({
      title: m.title,
      body: m.body,
      category: m.category,
      sortOrder: i,
    })),
    skipDuplicates: true,
  });
}

export async function listMacros(): Promise<MacroPlain[]> {
  const rows = await db.supportMacro.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toPlain);
}

export async function createMacro(input: {
  title: string;
  body: string;
  category?: string | null;
}): Promise<MacroPlain> {
  const last = await db.supportMacro.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const row = await db.supportMacro.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category?.trim() || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return toPlain(row);
}

export async function updateMacro(
  id: string,
  input: { title?: string; body?: string; category?: string | null },
): Promise<MacroPlain> {
  const data: {
    title?: string;
    body?: string;
    category?: string | null;
  } = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.body !== undefined) data.body = input.body.trim();
  if (input.category !== undefined) data.category = input.category?.trim() || null;
  const row = await db.supportMacro.update({ where: { id }, data });
  return toPlain(row);
}

export async function deleteMacro(id: string): Promise<void> {
  await db.supportMacro.delete({ where: { id } });
}
