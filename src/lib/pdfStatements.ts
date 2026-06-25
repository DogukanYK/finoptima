// PDF banka ekstresi ayrıştırma — Enpara mevduat, Yapı Kredi ve Garanti
// Miles&Smiles kredi kartı ekstreleri. unpdf ile metin çıkarılır.

import { extractText, getDocumentProxy } from "unpdf";
import { classifyKind, type TxKind } from "@/lib/bankProfiles";

export type PdfRow = {
  date: Date;
  description: string;
  amount: number; // pozitif
  kind: TxKind;
};

export type PdfBank = "ENPARA" | "YAPIKREDI" | "GARANTI_CARD";

export type PdfParseResult = {
  bank: PdfBank;
  accountType: "DEBIT" | "CREDIT_CARD";
  rows: PdfRow[];
};

const TR_MONTHS: Record<string, number> = {
  ocak: 1,
  şubat: 2,
  subat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8,
  agustos: 8,
  eylül: 9,
  eylul: 9,
  ekim: 10,
  kasım: 11,
  kasim: 11,
  aralık: 12,
  aralik: 12,
};

function tl(s: string): number {
  const clean = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export function detectPdfKind(
  text: string,
): "ENPARA" | "YAPIKREDI" | "GARANTI_CARD" | "FINDEKS" | null {
  const t = text.toLocaleLowerCase("tr-TR");
  if (t.includes("findeks") && t.includes("risk raporu")) return "FINDEKS";
  if (t.includes("miles&smiles") || t.includes("miles & smiles"))
    return "GARANTI_CARD";
  if (t.includes("enpara")) return "ENPARA";
  if (t.includes("yapı kredi") || t.includes("yapikredi") || t.includes("worldcard"))
    return "YAPIKREDI";
  return null;
}

// ---- Enpara mevduat ekstresi ----
function parseEnpara(text: string, ownerName?: string): PdfRow[] {
  const start = text.indexOf("Açıklama Tutar Bakiye");
  const body = start >= 0 ? text.slice(start + 21) : text;

  const re =
    /(\d{2})\/(\d{2})\/(\d{2})\s+([\s\S]*?)\s(-\s*)?([\d.]+,\d{2})\s*TL\s+([\d.]+,\d{2})\s*TL/g;
  const rows: PdfRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const [, dd, mm, yy, descRaw, minus, amountStr] = m;
    const date = new Date(2000 + Number(yy), Number(mm) - 1, Number(dd));
    if (Number.isNaN(date.getTime())) continue;
    const description = descRaw.replace(/\s+/g, " ").trim();
    if (!description) continue;
    const amount = tl(amountStr);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const signed = minus ? -amount : amount;
    rows.push({
      date,
      description,
      amount,
      kind: classifyKind(description, "", signed, ownerName),
    });
  }
  return rows;
}

// ---- Kredi kartı ekstresi (Garanti M&S / Yapı Kredi) ----
function parseCardStatement(rawText: string): PdfRow[] {
  const rows: PdfRow[] = [];
  // PDF metnindeki "bosluk" yer tutucu token'larını temizle
  const text = rawText.replace(/bosluk/gi, " ");
  // GG Ay YYYY <açıklama> <tutar>[+]   ya da   GG Ay YYYY <açıklama> +<tutar>
  const re =
    /(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})\s+(.+?)\s+(\+?)\s*([\d.]+,\d{2})\s*(\+?)(?!\d)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const [, dd, monthName, yyyy, descRaw, plusBefore, amountStr, plusAfter] = m;
    const month = TR_MONTHS[monthName.toLocaleLowerCase("tr-TR")];
    if (!month) continue;
    const date = new Date(Number(yyyy), month - 1, Number(dd));
    if (Number.isNaN(date.getTime())) continue;

    let description = descRaw.replace(/\s+/g, " ").trim();
    // sondaki mil/taksit sayısını (ondalıksız) açıklamadan ayıkla
    description = description.replace(/\s\d{1,3}$/, "").trim();
    if (!description || /^toplam/i.test(description)) continue;

    const amount = tl(amountStr);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const isPayment =
      Boolean(plusBefore || plusAfter) ||
      /ödeme|odeme|teşekkür|tesekkur/i.test(description);

    rows.push({
      date,
      description,
      amount,
      kind: isPayment ? "TRANSFER" : "EXPENSE",
    });
  }
  return rows;
}

function parseGarantiCard(text: string): PdfRow[] {
  const start = text.indexOf("Tutar (TL)");
  const end = text.indexOf("Toplam", start >= 0 ? start : 0);
  const body = text.slice(
    start >= 0 ? start : 0,
    end >= 0 ? end : text.length,
  );
  return parseCardStatement(body);
}

function parseYapiKrediCard(text: string): PdfRow[] {
  const start = text.indexOf("Kalan Tutar/Taksit");
  const end = text.indexOf("TOPLAM", start >= 0 ? start : 0);
  const body = text.slice(
    start >= 0 ? start : 0,
    end >= 0 ? end : text.length,
  );
  return parseCardStatement(body);
}

export async function parsePdfStatement(
  buffer: ArrayBuffer,
  ownerName?: string,
): Promise<PdfParseResult | null> {
  const text = await extractPdfText(buffer);
  const kind = detectPdfKind(text);

  if (kind === "ENPARA") {
    return { bank: "ENPARA", accountType: "DEBIT", rows: parseEnpara(text, ownerName) };
  }
  if (kind === "GARANTI_CARD") {
    return {
      bank: "GARANTI_CARD",
      accountType: "CREDIT_CARD",
      rows: parseGarantiCard(text),
    };
  }
  if (kind === "YAPIKREDI") {
    return {
      bank: "YAPIKREDI",
      accountType: "CREDIT_CARD",
      rows: parseYapiKrediCard(text),
    };
  }
  return null;
}
