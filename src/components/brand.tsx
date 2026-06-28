import { cn } from "@/lib/utils";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center font-heading font-bold text-white"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(120deg, #2563EB 0%, #0EA5E9 100%)",
        borderRadius: size * 0.32,
        fontSize: size * 0.46,
        lineHeight: 1,
        letterSpacing: "-0.04em",
      }}
    >
      Fo
    </span>
  );
}

export function Brand({
  size = 36,
  className,
  hideText,
}: {
  size?: number;
  className?: string;
  hideText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {!hideText && (
        <span
          className="font-heading font-extrabold tracking-tight text-ink"
          style={{ fontSize: size * 0.5 }}
        >
          FinOptima
        </span>
      )}
    </span>
  );
}
