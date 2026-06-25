import Link from "next/link";
import { Brand } from "@/components/brand";
import { CalendarDays, PiggyBank, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Marka paneli — masaüstü */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />
        <div className="relative">
          <Link href="/" aria-label="FinOptima tanıtım sayfası">
            <Brand size={42} className="[&_span]:text-white" />
          </Link>
        </div>
        <div className="relative space-y-8">
          <h1 className="font-heading text-4xl font-extrabold leading-tight">
            Paranı tanı,
            <br />
            geleceğini planla.
          </h1>
          <p className="max-w-sm text-white/80">
            Harcamalarını saniyeler içinde kaydet, ajandanda gör, ay sonunda
            net bir rapor al. Hepsi tek yerde.
          </p>
          <ul className="space-y-3 text-sm text-white/90">
            <FeatureItem icon={<PiggyBank size={18} />}>
              Otomatik kategorilenen harcamalar
            </FeatureItem>
            <FeatureItem icon={<CalendarDays size={18} />}>
              Ajanda ve finans tek ekranda
            </FeatureItem>
            <FeatureItem icon={<Sparkles size={18} />}>
              6 aylık öngörü ve Findeks tavsiyeleri
            </FeatureItem>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} FinOptima
        </p>
      </aside>

      {/* Form alanı */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label="FinOptima tanıtım sayfası">
              <Brand size={38} />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function FeatureItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--app-radius)*0.6)] bg-white/15">
        {icon}
      </span>
      {children}
    </li>
  );
}
