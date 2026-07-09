// Bir kerelik: dedupHash'i null olan mevcut işlemlere gerçek makeDedupHash yazar.
// Çalıştır: set -a; source .env; set +a; npx tsx scripts/backfill-dedup-hash.ts
// Güncellenen satırlar dedupHash:null filtresinden düşer → cursor gerekmez.
import { PrismaClient } from "@prisma/client";
import { makeDedupHash } from "../src/lib/dedup";

(async () => {
  const db = new PrismaClient();
  let total = 0;
  for (;;) {
    const batch = await db.transaction.findMany({
      where: { dedupHash: null },
      select: { id: true, date: true, amount: true, description: true },
      take: 500,
    });
    if (batch.length === 0) break;
    for (const t of batch) {
      await db.transaction.update({
        where: { id: t.id },
        data: {
          dedupHash: makeDedupHash(t.date, Number(t.amount), t.description),
        },
      });
    }
    total += batch.length;
    console.log(`... ${total} güncellendi`);
  }
  console.log(`Bitti: ${total} işleme dedupHash yazıldı.`);
  await db.$disconnect();
})();
