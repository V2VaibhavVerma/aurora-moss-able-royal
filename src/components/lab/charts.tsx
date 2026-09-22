import { cn } from "@/lib/utils";
import { band } from "@/lib/ts/acf";

export type Series = {
  name: string;
  y: (number | null)[];
  color?: string;
  dashed?: boolean;
  width?: number;
};

function finite(xs: (number | null)[]): number[] {
  return xs.filter((v): v is number => v != null && Number.isFinite(v));
}

function extent(series: Series[], pad = 0.08): [number, number] {
  const all = series.flatMap((s) => finite(s.y));
  if (!all.length) return [-1, 1];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  return [lo - pad * span, hi + pad * span];
}

export function LinePlot({
  series,
  height = 220,
  splitAt,
  bandLo,
  bandHi,
  xLabel,
}: {
  series: Series[];
  height?: number;
  splitAt?: number;
  bandLo?: (number | null)[];
  bandHi?: (number | null)[];
  xLabel?: string;
}) {
  const n = Math.max(1, ...series.map((s) => s.y.length), bandLo?.length ?? 0);
  const [lo, hi] = extent([
    ...series,
    ...(bandLo && bandHi ? [{ name: "b", y: [...bandLo, ...bandHi] }] : []),
  ]);
  const w = 640;
  const h = height;
  const pl = 40;
  const pr = 12;
  const pt = 12;
  const pb = 28;
  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const x = (i: number) => pl + (i / Math.max(1, n - 1)) * iw;
  const y = (v: number) => pt + ((hi - v) / (hi - lo || 1)) * ih;

  const path = (ys: (number | null)[]) => {
    let d = "";
    let drawing = false;
    ys.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) {
        drawing = false;
        return;
      }
      d += `${drawing ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      drawing = true;
    });
    return d;
  };

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);

  let area = "";
  if (bandLo && bandHi) {
    const pts: { i: number; lo: number; hi: number }[] = [];
    const len = Math.min(bandLo.length, bandHi.length);
    for (let i = 0; i < len; i++) {
      const a = bandLo[i];
      const b = bandHi[i];
      if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
      pts.push({ i, lo: a, hi: b });
    }
    if (pts.length > 1) {
      const top = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.hi).toFixed(1)}`).join(" ");
      const bot = [...pts]
        .reverse()
        .map((p) => `L${x(p.i).toFixed(1)},${y(p.lo).toFixed(1)}`)
        .join(" ");
      area = `${top} ${bot} Z`;
    }
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-border" strokeWidth="1" />
            <text x={pl - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="9" fontFamily="IBM Plex Mono, ui-monospace, monospace">
              {Math.abs(t) >= 100 ? t.toFixed(0) : t.toFixed(1)}
            </text>
          </g>
        ))}
        {area ? <path d={area} fill="var(--color-chart-1)" opacity="0.12" /> : null}
        {splitAt != null ? (
          <line
            x1={x(splitAt)}
            x2={x(splitAt)}
            y1={pt}
            y2={h - pb}
            stroke="var(--color-warn)"
            strokeDasharray="3 4"
            strokeWidth="1.2"
          />
        ) : null}
        {series.map((s, i) => (
          <path
            key={s.name + i}
            d={path(s.y)}
            fill="none"
            stroke={s.color ?? `var(--color-chart-${(i % 5) + 1})`}
            strokeWidth={s.width ?? 1.6}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <text x={w / 2} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          {xLabel ?? "time"}
        </text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 px-1">
        {series.map((s, i) => (
          <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="inline-block h-0.5 w-4"
              style={{
                background: s.color ?? `var(--color-chart-${(i % 5) + 1})`,
                opacity: s.dashed ? 0.7 : 1,
              }}
            />
            {s.name}
          </span>
        ))}
        {splitAt != null ? (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-px w-4 border-t border-dashed border-warn" />
            the cut
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AcfBars({
  values,
  n,
  title,
  highlight,
}: {
  values: number[];
  n: number;
  title: string;
  highlight?: number[];
}) {
  const b = band(n);
  const w = 640;
  const h = 160;
  const pl = 36;
  const pr = 10;
  const pt = 14;
  const pb = 22;
  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const m = Math.max(1, values.length - 1);
  const x = (k: number) => pl + (k / m) * iw;
  const y = (v: number) => pt + ((1 - v) / 2) * ih;
  const zero = y(0);
  const barW = Math.max(2, (iw / m) * 0.55);

  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
        <line x1={pl} x2={w - pr} y1={zero} y2={zero} stroke="currentColor" className="text-border" />
        <line
          x1={pl}
          x2={w - pr}
          y1={y(b)}
          y2={y(b)}
          stroke="var(--color-destructive)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <line
          x1={pl}
          x2={w - pr}
          y1={y(-b)}
          y2={y(-b)}
          stroke="var(--color-destructive)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        {values.map((v, k) => {
          if (k === 0) return null;
          const hi = highlight?.includes(k);
          const yy = y(v);
          const bh = Math.abs(yy - zero);
          return (
            <rect
              key={k}
              x={x(k) - barW / 2}
              y={Math.min(yy, zero)}
              width={barW}
              height={Math.max(1, bh)}
              fill={hi ? "var(--color-warn)" : "var(--color-chart-1)"}
              opacity={Math.abs(v) > b ? 1 : 0.45}
            />
          );
        })}
        {[0, Math.round(m / 2), m].map((k) => (
          <text key={k} x={x(k)} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="IBM Plex Mono, ui-monospace, monospace">
            {k}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function DecompGrid({
  observed,
  trend,
  seasonal,
  resid,
}: {
  observed: number[];
  trend: (number | null)[];
  seasonal: (number | null)[];
  resid: (number | null)[];
}) {
  const rows: { name: string; y: (number | null)[]; color: string }[] = [
    { name: "Observed", y: observed, color: "var(--color-chart-1)" },
    { name: "Trend", y: trend, color: "var(--color-chart-4)" },
    { name: "Season", y: seasonal, color: "var(--color-chart-3)" },
    { name: "Residual", y: resid, color: "var(--color-chart-5)" },
  ];
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div key={r.name} className="rounded-lg border border-border/80 bg-background/40 px-2 py-1">
          <LinePlot series={[{ name: r.name, y: r.y, color: r.color }]} height={112} />
        </div>
      ))}
    </div>
  );
}

export function MiniBars({
  labels,
  values,
  highlight,
}: {
  labels: string[];
  values: number[];
  highlight?: number;
}) {
  const max = Math.max(1e-6, ...values.map(Math.abs));
  return (
    <div className="flex items-end gap-2 h-36">
      {values.map((v, i) => (
        <div key={labels[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{v.toFixed(2)}</span>
          <div className="flex h-24 w-full items-end rounded-sm bg-secondary">
            <div
              className={cn("w-full rounded-sm", highlight === i ? "bg-primary" : "bg-chart-1")}
              style={{ height: `${(Math.abs(v) / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
