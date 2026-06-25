import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  href,
  hrefLabel = "Tümü",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            {hrefLabel}
            <ChevronRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
