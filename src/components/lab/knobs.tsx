import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {label}
        </span>
        {value != null && (
          <span className="font-mono text-xs tabular-nums text-foreground">{value}</span>
        )}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-muted-foreground/90">{hint}</p> : null}
    </label>
  );
}

export function Range({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-10 w-full px-2 text-sm", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-10 w-full items-center justify-between gap-3 rounded-sm border border-border bg-secondary px-3 text-left text-sm"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-150",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background transition-transform duration-150",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border pb-4">
      <h3 className="font-display text-sm font-medium text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
