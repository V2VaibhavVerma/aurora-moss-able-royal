import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LabFrame({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">{main}</div>
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">{side}</div>
    </div>
  );
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
  unit?: string;
}) {
  const pct = ((value - min) / (max - min || 1)) * 100;
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {Number.isInteger(step) && step >= 1 ? value : value.toFixed(2)}
          {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ ["--pct" as string]: `${pct}%` }}
        aria-label={label}
      />
      {hint ? <span className="block text-[11px] leading-snug text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "h-9 rounded-md px-3 text-xs font-medium transition-colors duration-150",
            value === o.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="overflow-x-auto rounded-lg border border-border bg-secondary/60 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground">
      {children}
    </p>
  );
}

export function Verdict({
  tone,
  title,
  children,
}: {
  tone: "good" | "bad" | "warn" | "info";
  title: string;
  children: ReactNode;
}) {
  const map = {
    good: "border-signal/40 bg-signal/10",
    bad: "border-destructive/40 bg-destructive/10",
    warn: "border-warn/40 bg-warn/10",
    info: "border-border bg-card",
  } as const;
  const label = {
    good: "Suitable",
    bad: "Not suitable",
    warn: "Careful",
    info: "Read this",
  } as const;
  return (
    <aside className={cn("rounded-xl border p-4", map[tone])}>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label[tone]}</p>
      <h3 className="mt-1 font-display text-lg leading-snug">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </aside>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="font-mono text-base tabular-nums text-foreground">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {title ? <h3 className="mb-3 font-display text-lg">{title}</h3> : null}
      {children}
    </section>
  );
}

export function Table({
  headers,
  rows,
  highlight,
}: {
  headers: string[];
  rows: (string | number)[][];
  highlight?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn("border-b border-border/60", highlight === i && "bg-signal/10")}>
              {r.map((c, j) => (
                <td key={j} className={cn("px-2 py-2", j === 0 ? "text-foreground" : "font-mono tabular-nums")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
