// Findeks Risk Raporu PDF ayrıştırma + gerçek veriye dayalı tavsiye üretimi.
// Resmî KKB raporundan okunan GERÇEK verilerdir (tahmini değildir).

import { extractPdfText } from "@/lib/pdfStatements";

export type FindeksCard = {
  status: string; // "Açık" | "Kapalı"
  limit: number;
  debt: number;
  utilization: number; // %
  cashAdvance: number;
  restructured: boolean;
  openedAt: string | null;
};

export type FindeksComponentWeights = {
  usage: number; // Kredi Kullanım Yoğunluğu
  currentDebt: number; // Mevcut Hesap ve Borç Durumu
  payment: number; // Ödeme Alışkanlıkları
  newProducts: number; // Yeni Kredili Ürün Açılışları
};

export type ParsedFindeks = {
  score: number;
  band: string;
  reportDate: string; // ISO
  componentWeights: FindeksComponentWeights;
  totalLimit: number;
  totalDebt: number;
  debtRatio: number; // %
  worstStatus: string;
  cards: FindeksCard[];
};

export type FindeksAdvice = {
  title: string;
  body: string;
  severity: "high" | "medium" | "low";
};

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function scoreBand(score: number): string {
  if (score < 700) return "En riskli";
  if (score < 1100) return "Orta riskli";
  if (score < 1500) return "Az riskli";
  if (score < 1700) return "İyi";
  return "Çok iyi";
}

function parseCards(section: string): FindeksCard[] {
  const cards: FindeksCard[] = [];
  // her kart bloğu "Açık Limit ..." ya da "Kapalı Limit ..." ile başlar
  const chunks = section.split(/(?=(?:Açık|Kapalı)\s+Limit\s)/);
  for (const chunk of chunks) {
    const statusM = chunk.match(/^(Açık|Kapalı)\s+Limit\s/);
    if (!statusM) continue;
    const limitM = chunk.match(/^(?:Açık|Kapalı)\s+Limit\s+([\d.]+)\s*TL/);
    const debtM = chunk.match(/Borç\s+([\d.]+)\s*TL/);
    const utilM = chunk.match(/Limit Kullanım Oranı:\s*%\s*([\d.,]+)/);
    const cashM = chunk.match(/Nakit Avans Kullanım\s*Tutarı:\s*([\d.]+)\s*TL/);
    const restM = chunk.match(/Yeniden\s*Yapılandırma:\s*(Yok|Var)/);
    const openM = chunk.match(/Açılış Tarihi:\s*(\d{2}\/\d{2}\/\d{4})/);
    cards.push({
      status: statusM[1],
      limit: limitM ? num(limitM[1]) : 0,
      debt: debtM ? num(debtM[1]) : 0,
      utilization: utilM ? Number(utilM[1].replace(",", ".")) : 0,
      cashAdvance: cashM ? num(cashM[1]) : 0,
      restructured: restM ? restM[1] === "Var" : false,
      openedAt: openM ? openM[1] : null,
    });
  }
  return cards;
}

export function parseFindeksReport(text: string): ParsedFindeks | null {
  const scoreM = text.match(/Findeks Kredi Notunuz\s+(\d{2,4})/);
  if (!scoreM) return null;
  const score = Number(scoreM[1]);

  const dateM = text.match(/RAPOR TARİHİ\s+(\d{2})\.(\d{2})\.(\d{4})/);
  const reportDate = dateM
    ? new Date(Number(dateM[3]), Number(dateM[2]) - 1, Number(dateM[1]))
    : new Date();

  const weightM = text.match(/%(\d+)\s+%(\d+)\s+%(\d+)\s+%(\d+)/);
  const componentWeights: FindeksComponentWeights = weightM
    ? {
        usage: Number(weightM[1]),
        currentDebt: Number(weightM[2]),
        payment: Number(weightM[3]),
        newProducts: Number(weightM[4]),
      }
    : { usage: 45, currentDebt: 32, payment: 18, newProducts: 5 };

  const limitM = text.match(/Limitler\s+Toplamı \(D3\)\s+([\d.]+)\s*TL/);
  const debtM = text.match(/Borçlar\s+Toplamı \(D4\)\s+([\d.]+)\s*TL/);
  const ratioM = text.match(/Borç \/ Limit Oranı\s+%\s*(\d+)/);
  const worstM = text.match(/En Olumsuz Durum\s+(.+?)\s+Gecikmedeki/);

  let cards: FindeksCard[] = [];
  const cardStart = text.indexOf("Kredi Kartları");
  if (cardStart >= 0) {
    const cardEnd = text.indexOf("Tüketici Kredileri", cardStart);
    cards = parseCards(
      text.slice(cardStart, cardEnd >= 0 ? cardEnd : cardStart + 6000),
    );
  }

  return {
    score,
    band: scoreBand(score),
    reportDate: reportDate.toISOString(),
    componentWeights,
    totalLimit: limitM ? num(limitM[1]) : 0,
    totalDebt: debtM ? num(debtM[1]) : 0,
    debtRatio: ratioM ? Number(ratioM[1]) : 0,
    worstStatus: worstM ? worstM[1].trim() : "—",
    cards,
  };
}

export async function parseFindeksPdf(
  buffer: ArrayBuffer,
): Promise<ParsedFindeks | null> {
  const text = await extractPdfText(buffer);
  if (!/findeks/i.test(text) || !/risk raporu/i.test(text)) return null;
  return parseFindeksReport(text);
}

// Gerçek rapor verisinden kişiye özel tavsiye üretir.
export function findeksAdvice(report: ParsedFindeks): FindeksAdvice[] {
  const advice: FindeksAdvice[] = [];
  const openCards = report.cards.filter((c) => c.status === "Açık");

  if (report.debtRatio > 100) {
    advice.push({
      title: "Borç/limit oranını acilen düşür",
      body: `Toplam borcun limitinin %${report.debtRatio}'i. Bu, Findeks notunu en çok aşağı çeken faktör (Kredi Kullanım Yoğunluğu, ağırlık %${report.componentWeights.usage}). Önceliğin borcu limitin %30'unun altına indirmek olmalı.`,
      severity: "high",
    });
  } else if (report.debtRatio > 30) {
    advice.push({
      title: "Kredi kullanım oranını azalt",
      body: `Borç/limit oranın %${report.debtRatio}. %30'un altına inmek notunu belirgin yükseltir.`,
      severity: "medium",
    });
  }

  const overLimit = openCards.filter((c) => c.utilization > 90);
  if (overLimit.length > 0) {
    const worst = overLimit.sort((a, b) => b.utilization - a.utilization)[0];
    advice.push({
      title: "Limitte/aşımda kart var",
      body: `${overLimit.length} kredi kartın limitinin %90'ından fazlasını kullanıyor (en yükseği %${worst.utilization}). Bu kartlara öncelik verip bakiyeyi düşür; sürekli limitte gezmek skoru sürekli baskılar.`,
      severity: "high",
    });
  }

  const cashAdvance = openCards.reduce((s, c) => s + c.cashAdvance, 0);
  if (cashAdvance > 0) {
    advice.push({
      title: "Nakit avans borcunu kapat",
      body: `Kartlarında toplam ${Math.round(cashAdvance).toLocaleString("tr-TR")} TL nakit avans borcu var. Nakit avans hem yüksek faizli hem de skor için olumsuz; bütçende ilk kapatılacak kalem bu olmalı.`,
      severity: "high",
    });
  }

  const restructured = report.cards.filter((c) => c.restructured);
  if (restructured.length > 0) {
    advice.push({
      title: "Yapılandırılmış borcu düzenli öde",
      body: "Yeniden yapılandırılmış borcun var. Taksitleri aksatmadan ödemen, zamanla bu olumsuz etkiyi silmenin tek yolu.",
      severity: "medium",
    });
  }

  if (/gecikme/i.test(report.worstStatus)) {
    advice.push({
      title: "Ödeme geçmişini temiz tut",
      body: `Geçmiş ödeme kaydında "${report.worstStatus}" görünüyor. Şu an aktif gecikmen yok — bunu koru; her zamanında ödeme bu izi yavaşça geçmişe iter.`,
      severity: "medium",
    });
  }

  advice.push({
    title: "Kullanmadığın kartı kapatma, düşük kullan",
    body: "Açık ama düşük kullanılan kartlar toplam limitini yükselterek kullanım oranını düşürür. Kartı kapatmak yerine düşük bakiyede tutmak skora daha iyi gelir.",
    severity: "low",
  });

  return advice;
}
