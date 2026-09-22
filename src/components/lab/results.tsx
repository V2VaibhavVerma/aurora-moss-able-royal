import { monthLabel } from "@/lib/forecast/dates";
import type { EngineResult } from "@/lib/forecast/engine";
import { paramInsight } from "@/lib/forecast/engine";
import type { LabParams } from "@/lib/forecast/types";
import { useLab } from "@/store/lab-store";
import { cn } from "@/lib/utils";

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

export function MetricStrip({ result }: { result: EngineResult }) {
  const items = [
    { k: "National MAE", v: fmt(result.shippedNatScore.mae) },
    { k: "RMSE", v: fmt(result.shippedNatScore.rmse) },
    { k: "Bias", v: fmt(result.shippedNatScore.bias) },
    { k: "Site MAE", v: fmt(result.siteMae) },
    { k: "Vol-w MAE", v: fmt(result.siteVolW) },
    { k: "Sites-sum MAE", v: fmt(result.siteSumScore.mae) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-6">
      {items.map((it) => (
        <div key={it.k} className="bg-card px-3 py-3">
          <dt className="text-[11px] text-muted-foreground">{it.k}</dt>
          <dd className="font-mono text-lg tabular-nums text-foreground">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Insight({ params, result }: { params: LabParams; result: EngineResult }) {
  const lines = paramInsight(params, result);
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        What just changed
      </p>
      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l} className="text-sm leading-relaxed text-foreground/90">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Leaderboard({ result }: { result: EngineResult }) {
  const setNational = useLab((s) => s.setNational);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 font-medium">Model</th>
            <th className="pb-2 font-medium">Family</th>
            <th className="pb-2 font-medium">MAE</th>
            <th className="pb-2 font-medium">RMSE</th>
            <th className="pb-2 font-medium">Bias</th>
            <th className="pb-2 font-medium">Path</th>
          </tr>
        </thead>
        <tbody>
          {result.natLeaderboard.map((row) => {
            const on = row.id === result.shippedNatId || (row.id === "mean" && result.shippedNatId === "mean");
            return (
              <tr
                key={row.id}
                className={cn("border-t border-border", on && "bg-accent/60")}
              >
                <td className="py-1.5">
                  <button
                    type="button"
                    className="font-mono text-xs hover:underline"
                    onClick={() =>
                      setNational(
                        row.id === "mean3" || row.id === "mean6" || row.id === "mean12"
                          ? "mean"
                          : (row.id as "mean"),
                      )
                    }
                  >
                    {row.id}
                  </button>
                </td>
                <td className="py-1.5 text-muted-foreground">{row.family}</td>
                <td className="py-1.5 font-mono tabular-nums">{fmt(row.score.mae)}</td>
                <td className="py-1.5 font-mono tabular-nums">{fmt(row.score.rmse)}</td>
                <td className="py-1.5 font-mono tabular-nums">{fmt(row.score.bias)}</td>
                <td className="py-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {row.pred.map((v) => v.toFixed(1)).join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PredTable({ result }: { result: EngineResult }) {
  const selected = useLab((s) => s.selectedSite);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 font-medium">Site</th>
            <th className="pb-2 font-medium">Rule</th>
            {result.evalMonths.map((t) => (
              <th key={t} className="pb-2 font-medium">
                {monthLabel(t)}
              </th>
            ))}
            <th className="pb-2 font-medium">MAE</th>
          </tr>
        </thead>
        <tbody>
          {result.sites.map((s) => (
            <tr
              key={s.id}
              className={cn("border-t border-border", selected === s.id && "bg-accent/60")}
            >
              <td className="py-1.5 font-mono text-xs">{s.id}</td>
              <td className="py-1.5 text-xs text-muted-foreground">{s.method}</td>
              {s.pred.map((v, i) => (
                <td key={i} className="py-1.5 font-mono text-xs tabular-nums">
                  {v.toFixed(1)}
                  <span className="text-muted-foreground"> / {s.actual[i]}</span>
                </td>
              ))}
              <td className="py-1.5 font-mono text-xs tabular-nums">{fmt(s.score.mae)}</td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <td className="py-1.5 font-medium">National</td>
            <td className="py-1.5 text-xs text-muted-foreground">{result.shippedNatId}</td>
            {result.shippedNat.map((v, i) => (
              <td key={i} className="py-1.5 font-mono text-xs tabular-nums">
                {v.toFixed(1)}
                <span className="text-muted-foreground"> / {result.actualNat[i]}</span>
              </td>
            ))}
            <td className="py-1.5 font-mono text-xs tabular-nums">
              {fmt(result.shippedNatScore.mae)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Each cell is forecast / actual. Click a site tile above to highlight its row.
      </p>
    </div>
  );
}
