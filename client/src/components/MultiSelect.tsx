// Simple multi-select chip group used in the New Entry form.
import { cn } from "@/lib/utils";

export default function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              active
                ? "border-[var(--color-brand-green)] bg-emerald-50 text-emerald-700"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
