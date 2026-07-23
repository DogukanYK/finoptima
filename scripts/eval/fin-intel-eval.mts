// FinOptima — Finansal Zekâ Değerlendirme Motoru
//
// Ne yapar: her senaryoyu FinOptima'nın "kredi koçu" personasıyla ANSWER_MODEL'e
// sorar, cevabı ayrı bir JÜRİ modeli (Opus) ile rubriğe göre 0-100 puanlar.
// Çıktı: genel skor + kategori kırılımı + en zayıf cevaplar (nereyi düzelteceğini gösterir).
//
// Çalıştır:  npx tsx --env-file=.env scripts/eval/fin-intel-eval.mts
// İyileştirdikçe tekrar çalıştır → skorun yükselişini gör.

import Anthropic from "@anthropic-ai/sdk";
import { SCENARIOS, type Scenario } from "./scenarios.mts";
import { PROMPT_V1, PROMPT_V2 } from "./prompts.mts";

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("ANTHROPIC_API_KEY yok (--env-file=.env ekle)"); process.exit(1); }
const anthropic = new Anthropic({ apiKey: KEY });

// FinOptima kullanıcıya finansal soruları YANITLAYAN model (interaktif asistan = Sonnet).
const ANSWER_MODEL = "claude-sonnet-4-6";
const JUDGE_MODEL = "claude-opus-4-8";

// --ab ile V1 (mevcut) vs V2 (geliştirilmiş) karşılaştırılır; yoksa yalnız V1.
const AB = process.argv.includes("--ab");

const JUDGE_SYSTEM = `Sen bir finansal-danışmanlık kalite denetçisisin. Bir kullanıcı sorusu, değerlendirme rubriği ve bir AI cevabı verilecek. Cevabı SADECE rubriğe göre değerlendir.

Puanlama:
- "olmali" listesindeki her madde için: cevap bu noktaya net değindi mi?
- "olmamali" listesindeki her madde için: cevapta bu hata/kırmızı bayrak VAR mı? (varsa ağır ceza)
- 0-100 arası tek bir puan ver. olmamali ihlali varsa puan 50'nin altına inmeli. Tüm olmali karşılanıp hiç ihlal yoksa 90+.

SADECE şu JSON'u döndür (başka metin yok):
{"puan": <0-100>, "karsilanan": ["<olmali maddesi>", ...], "ihlal": ["<olmamali maddesi>", ...], "gerekce": "<tek cümle Türkçe>"}`;

function extractJSON(s: string): any {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("JSON yok: " + s.slice(0, 120));
  return JSON.parse(m[0]);
}

async function answer(sc: Scenario, system: string): Promise<string> {
  const r = await anthropic.messages.create({
    model: ANSWER_MODEL,
    max_tokens: 900,
    system,
    messages: [{ role: "user", content: sc.soru }],
  });
  return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
}

async function judge(sc: Scenario, cevap: string) {
  const rubrik = `SORU: ${sc.soru}

RUBRİK
olmali (cevabın değinmesi gereken):
${sc.olmali.map((x) => "- " + x).join("\n")}
olmamali (cevapta OLMAMASI gereken hatalar):
${sc.olmamali.map((x) => "- " + x).join("\n")}

AI CEVABI:
"""${cevap}"""`;
  const r = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 700,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: rubrik }],
  });
  const txt = r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
  return extractJSON(txt) as { puan: number; karsilanan: string[]; ihlal: string[]; gerekce: string };
}

// Eşzamanlılık sınırı (API rate limit'e nazik)
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const avg = (a: number[]) => Math.round(a.reduce((s, x) => s + x, 0) / a.length);

async function runVariant(label: string, system: string) {
  console.log(`\n----- ${label} -----`);
  const results = await mapLimit(SCENARIOS, 5, async (sc) => {
    try {
      const cevap = await answer(sc, system);
      const j = await judge(sc, cevap);
      const durum = j.puan >= 80 ? "✓" : j.puan >= 60 ? "~" : "✗";
      console.log(`${durum} [${j.puan.toString().padStart(3)}] ${sc.kategori.padEnd(11)} ${sc.id}`);
      return { sc, cevap, ...j };
    } catch (e: any) {
      console.log(`!  [err] ${sc.id}: ${e.message}`);
      return { sc, cevap: "", puan: 0, karsilanan: [], ihlal: ["<hata>"], gerekce: e.message };
    }
  });
  const cats: Record<string, number[]> = {};
  for (const r of results) (cats[r.sc.kategori] ??= []).push(r.puan);
  return { results, cats, genel: avg(results.map((r) => r.puan)) };
}

(async () => {
  console.log(`\nFinOptima Finansal Zekâ Değerlendirmesi`);
  console.log(`Cevap: ${ANSWER_MODEL} · Jüri: ${JUDGE_MODEL} · ${SCENARIOS.length} senaryo · mod: ${AB ? "A/B (V1 vs V2)" : "V1"}`);

  const v1 = await runVariant("V1 (mevcut)", PROMPT_V1);
  const v2 = AB ? await runVariant("V2 (geliştirilmiş)", PROMPT_V2) : null;

  console.log(`\n===== KATEGORİ KIRILIMI =====`);
  const allCats = Object.keys(v1.cats);
  for (const k of allCats) {
    const s1 = avg(v1.cats[k]);
    if (v2) {
      const s2 = avg(v2.cats[k]);
      const d = s2 - s1;
      console.log(`  ${k.padEnd(12)} V1 ${s1.toString().padStart(3)}  →  V2 ${s2.toString().padStart(3)}   ${d >= 0 ? "+" : ""}${d}`);
    } else {
      console.log(`  ${k.padEnd(12)} ${s1.toString().padStart(3)}/100`);
    }
  }
  if (v2) {
    const d = v2.genel - v1.genel;
    console.log(`  ${"GENEL".padEnd(12)} V1 ${v1.genel}  →  V2 ${v2.genel}   ${d >= 0 ? "+" : ""}${d}`);
  } else {
    console.log(`  ${"GENEL".padEnd(12)} ${v1.genel}/100`);
  }

  const base = v2 ?? v1;
  const zayif = [...base.results].sort((a, b) => a.puan - b.puan).slice(0, 5);
  console.log(`\n===== EN ZAYIF 5 (${v2 ? "V2" : "V1"}) =====`);
  for (const r of zayif) {
    console.log(`[${r.puan}] ${r.sc.id} — ${r.ihlal.length ? "⚠ " + r.ihlal.join(", ") + " — " : ""}${r.gerekce}`);
  }

  const fs = await import("fs");
  fs.writeFileSync(
    new URL("./son-sonuc.json", import.meta.url),
    JSON.stringify({ v1: v1.results.map((r) => ({ id: r.sc.id, puan: r.puan })), v2: v2?.results.map((r) => ({ id: r.sc.id, puan: r.puan })) }, null, 2),
  );
})().catch((e) => { console.error(e); process.exit(1); });
