import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface " +
  "px-3.5 text-ink text-base outline-none transition-colors " +
  "focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]";

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-ink"
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
};

export function Field({
  label,
  error,
  required,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const fieldId = id ?? props.name;
  return (
    <div>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <input
        id={fieldId}
        className={cn(
          inputClass,
          error && "border-destructive focus-visible:border-destructive",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
      )}
      <FieldError message={error} />
    </div>
  );
}
