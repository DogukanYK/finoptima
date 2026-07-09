"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { categorize } from "@/lib/categorize";
import {
  detectColumns,
  classifyKind,
  parseStatementDate,
  parseStatementAmount,
  type TxKind,
} from "@/lib/bankProfiles";
import { parsePdfStatement, extractPdfText } from "@/lib/pdfStatements";
import { extractDocument } from "@/lib/extract";
import { claudeExtract } from "@/lib/extract/claude";
import { detectBankName } from "@/lib/extract/bankDetect";
import { makeDedupHash } from "@/lib/dedup";
import { SEED_CATEGORIES } from "@/lib/seed-data";

export type ParsedRow = {
  date: string; // ISO
  description: string;
  amount: number; // pozitif
  kind: TxKind;
  categoryId: string | null;
  categoryName: string | null;
  dedupHash: string;
  duplicate: boolean;
  force?: boolean; // kullanıcı "tekrar" satırını bilerek dahil ettiyse
};

export type ParseResult = {
  ok: boolean;
  error?: string;
  rows?: ParsedRow[];
  fileName?: string;
  detectedBank?: string;
  accountType?: "DEBIT" | "CREDIT_CARD";
};

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function readGrid(name: string, buffer: ArrayBuffer): unknown[][] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return Papa.parse<string[]>(text, { skipEmptyLines: true }).data;
  }
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false });
}

// Claude'un verdiği categoryHint (seed anahtarı) → kullanıcının o adlı kategorisi.
function mapHintToCategory(
  hint: string | null | undefined,
  categories: { id: string; name: string }[],
): string | null {
  if (!hint) return null;
  const seed = SEED_CATEGORIES.find((c) => c.key === hint);
  if (!seed) return null;
  const target = seed.name.toLocaleLowerCase("tr");
  const match = categories.find(
    (c) => c.name.toLocaleLowerCase("tr") === target,
  );
  return match?.id ?? null;
}

export async function parseStatement(formData: FormData): Promise<ParseResult> {
  const userId = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Lütfen bir dosya seç." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Dosya 10 MB'tan küçük olmalı." };
  }

  // Otomatik: offline okuyamazsa (düşük güven / görüntü) buluta yükselt — kullanıcı seçmez.
  const allowCloud = true;

  const [user, categories, existing] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.category.findMany({ where: { userId }, select: { id: true, name: true } }),
    db.transaction.findMany({
      where: { userId, dedupHash: { not: null } },
      select: { dedupHash: true },
    }),
  ]);
  const rules = await db.categoryRule.findMany({
    where: { userId },
    select: { pattern: true, categoryId: true, priority: true },
  });
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const existingHashes = new Set(existing.map((e) => e.dedupHash));
  const ownerName = user?.name ?? undefined;

  const buffer = await file.arrayBuffer();
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  const isImage =
    /^image\//.test(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

  type Raw = {
    date: Date;
    description: string;
    amount: number;
    kind: TxKind;
    categoryHint?: string | null;
  };
  let raw: Raw[] = [];
  let detectedBank: string | undefined;
  let accountType: "DEBIT" | "CREDIT_CARD" = "DEBIT";

  if (isPdf) {
    // 1) Bilinen banka hızlı yolu (Enpara / Yapı Kredi / Garanti).
    let known: Awaited<ReturnType<typeof parsePdfStatement>> = null;
    try {
      known = await parsePdfStatement(buffer, ownerName);
    } catch {
      known = null;
    }
    if (known) {
      detectedBank =
        known.bank === "ENPARA"
          ? "Enpara"
          : known.bank === "YAPIKREDI"
            ? "Yapı Kredi"
            : "Garanti BBVA";
      accountType = known.accountType;
      raw = known.rows;
    } else {
      // 2) Jenerik evrensel motor (her banka/dil) — metni çıkar + yönlendirici.
      let text = "";
      try {
        text = await extractPdfText(buffer);
      } catch {
        // Metin katmanı çıkarılamadı (taranmış/uyumsuz PDF) — hata verme, buluta
        // bırak: Claude PDF'i doğrudan okur; demo'da senaryo dosya adından gelir.
        text = "";
      }
      const result = await extractDocument(
        { fileName: file.name, mimeType: "application/pdf", buffer, text },
        { allowCloud },
      );
      if (result.rows.length === 0) {
        return {
          ok: false,
          error:
            "Belgeden işlem çıkarılamadı. Tanınmayan belgelerde AI gerekebilir — ANTHROPIC_API_KEY ekli mi?",
        };
      }
      raw = result.rows.map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        kind: (r.direction === "in" ? "INCOME" : "EXPENSE") as TxKind,
        categoryHint: r.categoryHint,
      }));
      detectedBank =
        result.meta?.bank ??
        (result.engine === "claude" ? "AI ile okundu" : "Otomatik tanındı");
      accountType =
        result.docKind === "card_statement" ? "CREDIT_CARD" : "DEBIT";
    }
  } else if (isImage) {
    // Görüntü / ekran görüntüsü: offline okunamaz → otomatik buluta (Claude vision).
    const result = await extractDocument(
      { fileName: file.name, mimeType: file.type || "image/png", buffer },
      { allowCloud },
    );
    if (result.rows.length === 0) {
      return {
        ok: false,
        error:
          "Bu görüntüden işlem okunamadı. Görüntü/ekran görüntüsü okuma yapay zekâ (bulut) gerektirir — ANTHROPIC_API_KEY ekli mi?",
      };
    }
    raw = result.rows.map((r) => ({
      date: r.date,
      description: r.description,
      amount: r.amount,
      kind: (r.direction === "in" ? "INCOME" : "EXPENSE") as TxKind,
      categoryHint: r.categoryHint,
    }));
    detectedBank = result.meta?.bank ?? "AI ile okundu";
    accountType =
      result.docKind === "card_statement" ? "CREDIT_CARD" : "DEBIT";
  } else {
    let grid: unknown[][];
    try {
      grid = readGrid(file.name, buffer);
    } catch {
      return { ok: false, error: "Dosya okunamadı. Excel veya CSV deneyin." };
    }
    if (grid.length < 2) {
      return { ok: false, error: "Dosyada yeterli satır yok." };
    }

    // Banka adı genelde başlık satırının üstünde; ilk ~25 satırın metninden tanı.
    const gridText = grid
      .slice(0, 25)
      .map((r) => (r ?? []).map(cellText).join(" "))
      .join("\n");
    detectedBank = detectBankName(gridText) ?? undefined;

    let headerIdx = -1;
    let columns = null;
    for (let i = 0; i < Math.min(grid.length, 30); i++) {
      const headers = (grid[i] ?? []).map((c) => cellText(c));
      const detected = detectColumns(headers);
      if (detected) {
        headerIdx = i;
        columns = detected;
        break;
      }
    }
    if (!columns || headerIdx < 0) {
      return {
        ok: false,
        error:
          "Tarih, açıklama ve tutar kolonları bulunamadı. Dökümün başlık satırı içerdiğinden emin ol.",
      };
    }

    for (let i = headerIdx + 1; i < grid.length; i++) {
      const cells = grid[i];
      if (!cells || cells.length === 0) continue;
      const date = parseStatementDate(cells[columns.date]);
      const desc = cellText(cells[columns.desc]).trim();
      if (!date || !desc) continue;

      let signed = NaN;
      if (columns.amount != null) signed = parseStatementAmount(cells[columns.amount]);
      if (Number.isNaN(signed) && columns.debit != null) {
        const d = parseStatementAmount(cells[columns.debit]);
        if (!Number.isNaN(d) && d !== 0) signed = -Math.abs(d);
      }
      if (Number.isNaN(signed) && columns.credit != null) {
        const c = parseStatementAmount(cells[columns.credit]);
        if (!Number.isNaN(c) && c !== 0) signed = Math.abs(c);
      }
      if (Number.isNaN(signed) || signed === 0) continue;

      const label =
        columns.label != null ? cellText(cells[columns.label]) : "";
      raw.push({
        date,
        description: desc,
        amount: Math.abs(signed),
        kind: classifyKind(desc, label, signed, ownerName),
      });
    }
  }

  if (raw.length === 0) {
    return { ok: false, error: "Geçerli işlem satırı bulunamadı." };
  }

  const batchSeen = new Set<string>();
  const rows: ParsedRow[] = raw.map((r) => {
    const matchedCat =
      r.kind === "TRANSFER"
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
      kind: r.kind,
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
    detectedBank,
    accountType,
  };
}

export async function commitStatement(payload: {
  bankName: string;
  accountId: string | null;
  newAccount: { label: string; type: string } | null;
  fileName: string;
  rows: ParsedRow[];
}): Promise<{ ok: boolean; imported: number; skipped: number }> {
  const userId = await requireUserId();

  // Sunucu otoritesi: istemcinin duplicate bayrağına güvenme; hash'leri yeniden
  // hesapla, DB'de ya da bu partide zaten olanı atla — force'lu satırlar hariç
  // (kullanıcı önizlemede "tekrar"ı bilerek geri dahil etti).
  const existing = await db.transaction.findMany({
    where: { userId, dedupHash: { not: null } },
    select: { dedupHash: true },
  });
  const existingHashes = new Set(existing.map((e) => e.dedupHash));
  const seen = new Set<string>();
  const rows: (ParsedRow & { hash: string })[] = [];
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
        bankName: payload.bankName,
        label: payload.newAccount.label.slice(0, 60) || "İçe aktarılan hesap",
        type:
          payload.newAccount.type === "CREDIT_CARD"
            ? "CREDIT_CARD"
            : "CHECKING",
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
          bankProfile: payload.bankName,
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

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/findeks");
  return {
    ok: true,
    imported: rows.length,
    skipped: payload.rows.length - rows.length,
  };
}

// "AI Gözden Geçir" — dosyayı DOĞRUDAN Claude'a gönderir (offline'ı atlar).
// Yönleri/tutarları/açıklamaları temiz çıkarır; banka tanınmasa bile.
export async function reviewWithAI(formData: FormData): Promise<ParseResult> {
  const userId = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Dosya bulunamadı." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Dosya 10 MB'tan küçük olmalı." };
  }

  const [categories, existing, rules] = await Promise.all([
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
    console.error("[reviewWithAI] Claude hatası:", e);
    return {
      ok: false,
      error: "Yapay zekâ okuması başarısız oldu. API anahtarı / limit kontrol et.",
    };
  }
  if (result.rows.length === 0) {
    return { ok: false, error: "Belgeden işlem çıkarılamadı." };
  }

  const batchSeen = new Set<string>();
  const rows: ParsedRow[] = result.rows.map((r) => {
    const kind: TxKind = r.direction === "in" ? "INCOME" : "EXPENSE";
    const matchedCat =
      categorize(r.description, rules) ??
      mapHintToCategory(r.categoryHint, categories);
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
    detectedBank: result.meta?.bank ?? "AI ile okundu",
    accountType: result.docKind === "card_statement" ? "CREDIT_CARD" : "DEBIT",
  };
}
