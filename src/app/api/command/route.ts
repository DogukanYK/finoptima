// Komut paleti canlı arama — kullanıcının kategorileri, hesapları ve son
// işlemleri içinde arar. Sonuçlar DERİN yönlendirir (?category= / ?search=),
// böylece "en ufak yere bile" tek adımda gidilir. Login-gated.

import { NextResponse, type NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { foldTr } from "@/lib/command-index";

const EMPTY = { categories: [], accounts: [], transactions: [] };

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json(EMPTY, { status: 401 });
  }

  const q = foldTr(req.nextUrl.searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json(EMPTY);

  const [cats, accs, txs] = await Promise.all([
    db.category.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true, icon: true, color: true },
    }),
    db.account.findMany({
      where: { userId },
      select: { id: true, label: true, bankName: true },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 300,
      select: { id: true, description: true, amount: true, date: true, kind: true },
    }),
  ]);

  const categories = cats
    .filter((c) => foldTr(c.name).includes(q))
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      label: c.name,
      kind: c.kind,
      icon: c.icon,
      color: c.color,
      href: `/transactions?category=${c.id}`,
    }));

  const accounts = accs
    .filter((a) => foldTr(`${a.label ?? ""} ${a.bankName}`).includes(q))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      label: a.label || a.bankName,
      sub: a.bankName,
      href: `/settings?tab=accounts`,
    }));

  // İşlem açıklamalarında ara; aynı açıklamayı tekrar göstermemek için katla.
  const seen = new Set<string>();
  const transactions = txs
    .filter((t) => foldTr(t.description).includes(q))
    .filter((t) => {
      const k = foldTr(t.description);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      label: t.description,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      kind: t.kind,
      href: `/transactions?search=${encodeURIComponent(t.description)}`,
    }));

  return NextResponse.json({ categories, accounts, transactions });
}
