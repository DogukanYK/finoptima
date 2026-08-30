// Banka dökümü import çekirdeği — userId parametreli. Web action (import.ts)
// requireUserId ile, mobil API Bearer userId ile buradan çağırır.
// AI (Claude) yolu: dosya (PDF/görüntü) → çıkarım → kategorize + dedup → satırlar.

import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { extractPdfText } from "@/lib/pdfStatements";
import { claudeExtract } from "@/lib/extract/claude";
import { resolveExtractedKind } from "@/lib/extract/transfer";
import { makeDedupHash } from "@/lib/dedup";
import { rateLimit } from "@/lib/rate-limit";
import { AI_DEMO } from "@/lib/ai/client";
import { SEED_CATEGORIES } from "@/lib/seed-data";

export type ImportKind = "INCOME" | "EXPENSE" | "TRANSFER";

export type ImportRow = {
  date: string; // ISO
  description: string;
  amount: number; // pozitif
  kind: ImportKind;
  categoryId: string | null;
  categoryName: string | null;
  dedupHash: string;
  duplicate: boolean;
  force?: boolean;
};

export type ImportParseResult = {
  ok: boolean;
  error?: string;
  rows?: ImportRow[];
  fileName?: string;
  detectedBank?: string;
};

function mapHintToCategory(
  hint: string | null | undefined,
  categories: { id: string; name: string }[],
): string | null {
  if (!hint) return null;
  const seed = SEED_CATEGORIES.find((c) => c.key === hint);
  if (!seed) return null;
  const target = seed.name.toLocaleLowerCase("tr");
  const match = categories.find((c) => c.name.toLocaleLowerCase("tr") === target);
  return match?.id ?? null;
}

// Dosyayı doğrudan Claude'a gönderip yapısal satırları çıkarır (mobil AI yolu).
export async function reviewImportForUser(
  userId: string,
  file: File,
): Promise<ImportParseResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Dosya bulunamadı." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Dosya 10 MB'tan küçük olmalı." };
  }

  // Maliyet tavanı: belge okuma (vision/PDF) çağrısı pahalı ve token'ı çok.
  // Demo modunda API çağrılmadığı için sınır uygulanmaz.
  if (!AI_DEMO) {
    const rl = await rateLimit(`import:ai:${userId}`, 15, 60 * 60 * 1000);
    if (!rl.ok) {
      return {
        ok: false,
        error:
          "Saatlik belge okuma limitine ulaştın. Biraz sonra tekrar dener misin?",
      };
    }
  }

  const [user, categories, existing, rules] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.category.findMany({ where: { userId }, select: { id: true, name: true } }),
    db.transaction.findMany({
      where: { userId, dedupHash: { not: null } },
      select: { dedupHash: true },
    }),
    db.categoryRule.findMany({
      where: { userId },
      select: { pattern: true, categoryId: true, priority: true },
    }),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const existingHashes = new Set(existing.map((e) => e.dedupHash));
  const ownerName = user?.name ?? undefined; // kendi adına havale = transfer

  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();
  const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
  let text = "";
  if (isPdf) {
    try {
      text = await extractPdfText(buffer);
    } catch {
      text = "";
    }
  }
  const mimeType = isPdf ? "application/pdf" : file.type || "image/png";

  let result;
  try {
    result = await claudeExtract({ fileName: file.name, mimeType, buffer, text });
  } catch (e) {
    console.error("[reviewImportForUser] Claude hatası:", e);
    return { ok: false, error: "Yapay zekâ okuması başarısız oldu." };
  }
  if (result.rows.length === 0) {
    return { ok: false, error: "Belgeden işlem çıkarılamadı." };
  }

  const batchSeen = new Set<string>();
  const rows: ImportRow[] = result.rows.map((r) => {
    // Transfer (virman / kart borcu ödemesi / kendi hesabına havale) gider sayılmaz.
    const kind: ImportKind = resolveExtractedKind(r, ownerName);
    const matchedCat =
      kind === "TRANSFER"
        ? null
        : (categorize(r.description, rules) ??
          mapHintToCategory(r.categoryHint, categories));
    const hash = makeDedupHash(r.date, r.amount, r.description);
    const duplicate = existingHashes.has(hash) || batchSeen.has(hash);
    batchSeen.add(hash);
    return {
      date: r.date.toISOString(),
      description: r.description,
      amount: r.amount,
      kind,
      categoryId: matchedCat,
      categoryName: matchedCat ? (catName.get(matchedCat) ?? null) : null,
      dedupHash: hash,
      duplicate,
    };
  });

  return {
    ok: true,
    rows,
    fileName: file.name,
    detectedBank: result.meta?.bank,
  };
}

// Seçilen satırları işlem olarak kaydeder (sunucu otoritesi: hash yeniden hesap,
// force'suz mükerrerleri atla). newAccount verilirse hesap oluşturur.
export async function commitImportForUser(
  userId: string,
  payload: {
    bankName: string;
    accountId: string | null;
    newAccount: { label: string; type: string } | null;
    fileName: string;
    rows: ImportRow[];
  },
): Promise<{ ok: boolean; imported: number; skipped: number }> {
  const existing = await db.transaction.findMany({
    where: { userId, dedupHash: { not: null } },
    select: { dedupHash: true },
  });
  const existingHashes = new Set(existing.map((e) => e.dedupHash));
  const seen = new Set<string>();
  const rows: (ImportRow & { hash: string })[] = [];
  for (const r of payload.rows) {
    const hash = makeDedupHash(new Date(r.date), r.amount, r.description);
    if (!r.force && (existingHashes.has(hash) || seen.has(hash))) continue;
    seen.add(hash);
    rows.push({ ...r, hash });
  }

  if (rows.length === 0) {
    return { ok: true, imported: 0, skipped: payload.rows.length };
  }

  let accountId = payload.accountId;
  if (!accountId && payload.newAccount) {
    const created = await db.account.create({
      data: {
        userId,
        bankName: payload.bankName || "Banka",
        label: payload.newAccount.label.slice(0, 60) || "İçe aktarılan hesap",
        type: payload.newAccount.type === "CREDIT_CARD" ? "CREDIT_CARD" : "CHECKING",
      },
    });
    accountId = created.id;
  }

  await db.$transaction(
    async (tx) => {
      await tx.statementImport.create({
        data: {
          userId,
          accountId,
          bankProfile: payload.bankName || "AI",
          fileName: payload.fileName.slice(0, 160),
          rowCount: rows.length,
          status: "COMPLETED",
        },
      });
      await tx.transaction.createMany({
        data: rows.map((r) => ({
          userId,
          kind: r.kind,
          amount: r.amount,
          description: r.description,
          date: new Date(r.date),
          categoryId: r.kind === "TRANSFER" ? null : r.categoryId,
          accountId,
          source: "STATEMENT" as const,
          dedupHash: r.hash,
        })),
      });
    },
    { timeout: 30_000 },
  );

  return {
    ok: true,
    imported: rows.length,
    skipped: payload.rows.length - rows.length,
  };
}
