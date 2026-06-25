"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label, FieldError, inputClass } from "@/components/ui/field";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
};

export function PasswordField({
  label,
  error,
  required,
  hint,
  id,
  className,
  ...props
}: Props) {
  const [show, setShow] = useState(false);
  const fieldId = id ?? props.name ?? "password";
  return (
    <div>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          type={show ? "text" : "password"}
          className={cn(
            inputClass,
            "pr-11",
            error && "border-destructive focus-visible:border-destructive",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[calc(var(--app-radius)*0.5)] text-muted hover:text-ink"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}
