import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/field";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, id, className, children, ...props }: SelectProps) {
  const fieldId = id ?? props.name;
  return (
    <div>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        <select
          id={fieldId}
          className={cn(
            "h-11 w-full appearance-none rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface pl-3.5 pr-10 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)] focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}
