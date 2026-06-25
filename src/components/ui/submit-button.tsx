"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

type Variant = "primary" | "accent" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? (pendingText ?? "İşleniyor…") : children}
    </button>
  );
}
