import Link from "next/link";
import { Brand } from "@/components/marketing/kit";
import { SUBTLE, INK, MUTED } from "@/components/marketing/theme";

const COLS: { h: string; items: { label: string; href: string }[] }[] = [
  {
    h: "ÜRÜN",
    items: [
      { label: "Kredi notu", href: "/kredi-notu" },
      { label: "Özellikler", href: "/ozellikler" },
      { label: "Nasıl çalışır", href: "/nasil-calisir" },
      { label: "Fiyatlandırma", href: "/fiyatlandirma" },
    ],
  },
  {
    h: "ŞİRKET",
    items: [
      { label: "Hakkımızda", href: "/hakkinda" },
      { label: "İletişim", href: "/iletisim" },
      { label: "SSS", href: "/sss" },
    ],
  },
  {
    h: "YASAL",
    items: [
      { label: "Güvenlik", href: "/guvenlik" },
      { label: "Gizlilik", href: "/gizlilik" },
      { label: "KVKK", href: "/gizlilik" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative z-[3] mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8">
      <div className="grid gap-8 border-t py-9 sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
        <div>
          <Link href="/" aria-label="FinOptima ana sayfa">
            <Brand />
          </Link>
          <p className="mt-3.5 max-w-[240px] text-sm leading-relaxed" style={{ color: SUBTLE }}>
            Kredi notunu yükselt, paranı kontrol et. Türkiye için tasarlandı.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.h}>
            <div className="mb-3.5 text-[12.5px] font-bold tracking-[0.06em]" style={{ color: INK }}>
              {col.h}
            </div>
            {col.items.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block py-1 text-sm font-medium transition-colors hover:text-[#2563EB]"
                style={{ color: SUBTLE }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t pt-4 text-[13px] sm:flex-row sm:justify-between" style={{ borderColor: "rgba(15,23,42,0.08)", color: MUTED }}>
        <span>© 2026 FinOptima · Türkiye&apos;de geliştirildi</span>
        <span>BETA</span>
      </div>
    </footer>
  );
}
