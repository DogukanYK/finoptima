// Banka/dil-bağımsız jenerik metin ayrıştırıcı — offline moat'ın çekirdeği.
// OCR ya da PDF metninden işlem satırları çıkarır; SABİT banka şablonu YOK.
// "Yeterince iyi" kapsam hedefler — belirsiz durumlar bulut (Claude) katmanına bırakılır.
//
// Mevcut `bankProfiles` yardımcılarını yeniden kullanır:
//   parseStatementAmount → hem 1.234,56 hem 1,234.56 (+ işaret/parantez)
//   parseStatementDate   → dd/mm/yyyy · dd.mm.yyyy · yyyy-mm-dd

import { parseStatementAmount, parseStatementDate } from "@/lib/bankProfiles";
import type { ExtractedRow } from "@/lib/extract/types";

export type GenericParseResult = {
  rows: ExtractedRow[];
  currency: string | null;
  confidence: number; // 0-1
};

// Çok-dilli ay adları (TR + EN; genişletilebilir).
const MONTHS: Record<string, number> = {
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6,
  temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

const CUR_MAP: Record<string, string> = {
  "₺": "TRY", tl: "TRY", try: "TRY",
  $: "USD", usd: "USD",
  "€": "EUR", eur: "EUR",
  "£": "GBP", gbp: "GBP",
};

// Türkçe karakterleri ASCII'ye katlar (sözcük eşleştirme için).
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ıİ]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// Çok-dilli yön sözcükleri.
const OUT_WORDS = [
  "odeme", "harcama", "cekim", "borc", "gider", "fatura",
  "debit", "payment", "purchase", "withdrawal", "fee", "charge",
  "lastschrift", "abbuchung", "zahlung", "achat", "prelevement",
];
const IN_WORDS = [
  "yatan", "gelen", "alacak", "iade", "gelir", "faiz", "maas",
  "credit", "deposit", "refund", "incoming", "salary", "interest",
  "gehalt", "lohn", "gutschrift", "eingang", "virement", "salaire",
];

function detectCurrency(text: string): string | null {
  const m = text.match(/₺|\btl\b|\btry\b|\busd\b|\$|\beur\b|€|\bgbp\b|£/i);
  return m ? (CUR_MAP[fold(m[0])] ?? null) : null;
}

// Bir satırda tarih bul (sayısal + metinsel ay).
function findDate(line: string): { date: Date; raw: string } | null {
  // dd/mm/yyyy ya da mm/dd/yyyy — ikinci alan >12 ise mm/dd diye çöz (US),
  // değilse dd/mm varsay (TR/EU). Bu, sessiz yanlış-tarihi önler.
  let m = line.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    let day = a;
    let mo = b;
    if (b > 12 && a <= 12) {
      day = b;
      mo = a;
    }
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31 && y >= 2000 && y <= 2100) {
      const d = new Date(y, mo - 1, day);
      if (!Number.isNaN(d.getTime())) return { date: d, raw: m[0] };
    }
  }
  m = line.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/);
  if (m) {
    const d = parseStatementDate(m[0]);
    if (d) return { date: d, raw: m[0] };
  }
  // dd Mon yyyy
  m = line.match(/\b(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]{3,})\s+(\d{4})\b/);
  if (m) {
    const mo = MONTHS[fold(m[2])];
    if (mo) {
      const d = new Date(Number(m[3]), mo - 1, Number(m[1]));
      if (!Number.isNaN(d.getTime())) return { date: d, raw: m[0] };
    }
  }
  // Mon dd, yyyy
  m = line.match(/\b([A-Za-zÇĞİÖŞÜçğıöşü]{3,})\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (m) {
    const mo = MONTHS[fold(m[1])];
    if (mo) {
      const d = new Date(Number(m[3]), mo - 1, Number(m[2]));
      if (!Number.isNaN(d.getTime())) return { date: d, raw: m[0] };
    }
  }
  return null;
}

// 2 ondalıklı tutar token'ları (her iki ondalık konvansiyonu + işaret/parantez).
const AMOUNT_RE =
  /[-+(]?\s*\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}\)?|[-+(]?\s*\d+[.,]\d{2}\)?/g;

function amountTokens(line: string): string[] {
  return line.match(AMOUNT_RE) ?? [];
}

export function parseGenericStatement(rawText: string): GenericParseResult {
  const currency = detectCurrency(rawText);
  // PDF metni satır sonu içermeyebilir (tek satıra sıkışmış işlemler). Her
  // tarihten önce satır başı ekleyerek her işlemi kendi satırına ayır.
  const normalized = rawText.replace(
    /(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})/g,
    "\n$1",
  );
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ExtractedRow[] = [];
  let candidates = 0;
  let prevBalance: number | null = null;

  for (const line of lines) {
    // Başlık/özet satırlarını atla (gerçek işlem değil).
    if (/sıra\s*no|açıklama|raporlama|bakiye\s*:|hesap (sahibi|türü|numara)/i.test(line))
      continue;

    const dateHit = findDate(line);
    if (!dateHit) continue;
    // Tarihi ÖNCE çıkar — yoksa "14.03.2024" içindeki "14.03" tutar sanılır.
    const lineNoDate = line.replace(dateHit.raw, " ");
    const tokens = amountTokens(lineNoDate);
    if (tokens.length === 0) continue; // hem tarih hem tutar gerek
    candidates++;

    // İşlem tutarı = ilk token; 2+ token varsa SON token = yürüyen bakiye.
    const txAmt = parseStatementAmount(tokens[0]);
    if (!Number.isFinite(txAmt) || txAmt === 0) continue;
    const balance =
      tokens.length >= 2
        ? parseStatementAmount(tokens[tokens.length - 1])
        : null;

    // Yön: işaret > bakiye-deltası (arttıysa gelir) > sözcük > varsayılan(gider).
    let direction: "in" | "out";
    if (txAmt < 0 || /\(/.test(tokens[0])) direction = "out";
    else if (/\+/.test(tokens[0])) direction = "in";
    else if (
      balance !== null &&
      Number.isFinite(balance) &&
      prevBalance !== null
    ) {
      direction = balance > prevBalance ? "in" : "out";
    } else {
      const f = fold(lineNoDate);
      if (IN_WORDS.some((w) => f.includes(w))) direction = "in";
      else if (OUT_WORDS.some((w) => f.includes(w))) direction = "out";
      else direction = "out"; // varsayılan: gider
    }
    if (balance !== null && Number.isFinite(balance)) prevBalance = balance;

    // Açıklama: tutar + para birimi token'larını çıkar (tarih zaten yok).
    let desc = lineNoDate;
    for (const t of tokens) desc = desc.replace(t, " ");
    desc = desc
      .replace(/₺|\btl\b|\btry\b|\busd\b|\$|\beur\b|€|\bgbp\b|£/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (desc.length < 2) desc = "İşlem";

    rows.push({
      date: dateHit.date,
      description: desc.slice(0, 120),
      amount: Math.abs(txAmt),
      direction,
      currency,
    });
  }

  // Güven: satır kapsama oranı × hacim (az satır = düşük güven → buluta yükselt).
  const coverage = candidates === 0 ? 0 : rows.length / candidates;
  const volume = Math.min(1, rows.length / 4);
  const confidence = Number((coverage * 0.7 + volume * 0.3).toFixed(2));

  return { rows, currency, confidence };
}
