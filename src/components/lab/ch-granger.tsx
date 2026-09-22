import { useMemo, useState } from "react";
import { granger } from "@/lib/ts/granger";
import { bivariateVAR, simulate } from "@/lib/ts/sim";
import { difference } from "@/lib/ts/stats";
import { LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Verdict } from "./ui";

type World = "none" | "x2y" | "y2x" | "both" | "rwfake" | "z";

export function ChGranger() {
  const [world, setWorld] = useState<World>("x2y");
  const [n, setN] = useState(220);
  const [seed, setSeed] = useState(13);
  const [p, setP] = useState(2);
  const [strength, setStrength] = useState(0.55);
  const [diff, setDiff] = useState(false);

  const pair = useMemo(() => {
    if (world === "none") return bivariateVAR(n, seed, 0, 0, 1);
    if (world === "x2y") return bivariateVAR(n, seed, 0, strength, 1);
    if (world === "y2x") return bivariateVAR(n, seed, strength, 0, 1);
    if (world === "both") return bivariateVAR(n, seed, strength * 0.7, strength * 0.7, 1);
    if (world === "rwfake") {
      const x = simulate("rw", n, seed, { sigma: 1 });
      const y = simulate("rw", n, seed + 1, { sigma: 1 });
      return { x, y };
    }
    const z = simulate("ar1", n, seed, { phi: 0.7, sigma: 1 });
    const x = z.map((v, i) => v + simulate("white", n, seed + 4, { sigma: 0.7 })[i]);
    const y = z.map((v, i) => 0.9 * v + simulate("white", n, seed + 7, { sigma: 0.7 })[i]);
    return { x, y };
  }, [world, n, seed, strength]);

  const x = diff ? difference(pair.x, 1) : pair.x;
  const y = diff ? difference(pair.y, 1) : pair.y;
  const xy = granger(y, x, p);
  const yx = granger(x, y, p);

  const read = () => {
    if (xy.helps && !yx.helps) return "X Granger-causes Y (one way)";
    if (yx.helps && !xy.helps) return "Y Granger-causes X (one way)";
    if (xy.helps && yx.helps) return "Feedback — they forecast each other";
    return "Neither direction helps";
  };

  const fake = world === "rwfake" && !diff;
  const confounder = world === "z";

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">8 · Granger causality</p>
          <h2 className="mt-1 font-display text-3xl">Predictive content in time — not a mechanism.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            X Granger-causes Y if past X helps you forecast Y beyond what past Y already does. Always run both
            directions. It is not “X caused Y in the real world.” Rain Granger-causes umbrella sales. Umbrella sales
            can Granger-cause rain readings if shops stock just before the monsoon.
          </p>
          <Formula>
            H<sub>0</sub>: b<sub>1</sub> = … = b<sub>p</sub> = 0 in Y on own lags + lags of X
          </Formula>
        </Panel>

        <Panel title="Two series">
          <Segmented
            value={world}
            onChange={setWorld}
            options={[
              { id: "none", label: "Independent" },
              { id: "x2y", label: "X → Y" },
              { id: "y2x", label: "Y → X" },
              { id: "both", label: "Feedback" },
              { id: "rwfake", label: "Two walks" },
              { id: "z", label: "Hidden Z" },
            ]}
          />
          <div className="mt-4">
            <LinePlot
              series={[
                { name: "X", y: x, color: "var(--color-chart-1)" },
                { name: "Y", y: y, color: "var(--color-chart-4)" },
              ]}
            />
          </div>
        </Panel>

        <Panel title="Both directions">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Does X help Y?</p>
              <p className="font-display text-2xl">{xy.helps ? "Reject H0" : "Fail to reject"}</p>
              <p className="font-mono text-xs text-muted-foreground">
                F = {xy.f.toFixed(2)} · p = {xy.pval.toFixed(3)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Does Y help X?</p>
              <p className="font-display text-2xl">{yx.helps ? "Reject H0" : "Fail to reject"}</p>
              <p className="font-mono text-xs text-muted-foreground">
                F = {yx.f.toFixed(2)} · p = {yx.pval.toFixed(3)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-foreground">{read()}.</p>
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="Lag p" value={p} min={1} max={8} step={1} onChange={setP} hint="Too short: miss delayed effects. Too long: waste degrees of freedom. Quarterly data often starts at 4 or 8." />
            <Knob label="Channel strength" value={strength} min={0} max={0.9} step={0.05} onChange={setStrength} />
            <Knob label="n" value={n} min={80} max={400} step={10} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={40} step={1} onChange={setSeed} />
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Difference both
              <input type="checkbox" checked={diff} onChange={(e) => setDiff(e.target.checked)} />
            </label>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="RSS restricted" value={xy.rssR.toFixed(1)} />
          <Stat label="RSS unrestricted" value={xy.rssU.toFixed(1)} />
        </div>
        {fake ? (
          <Verdict tone="bad" title="Not valid on raw random walks">
            <p>
              Two independent walks can look related just because both wander. Standard practice: difference to
              stationarity, or work in a VECM if they share a long-run level. Toggle “Difference both.”
            </p>
          </Verdict>
        ) : confounder ? (
          <Verdict tone="warn" title="A third series Z drives both">
            <p>
              Oil prices can drive inflation and the policy rate. A two-variable test then lies. Granger assumes you
              have not left out the thing that actually moves.
            </p>
          </Verdict>
        ) : world === "none" ? (
          <Verdict tone="good" title="Suitable negative">
            <p>
              Knowing one does not improve the short-term forecast of the other, at least at these lags. That is a
              real result. Granger belongs with VAR, not with univariate ARIMA.
            </p>
          </Verdict>
        ) : xy.helps || yx.helps ? (
          <Verdict tone="good" title={read()}>
            <p>
              Rejecting “A does not Granger-cause S” and failing the reverse is the pattern you hope for in a campaign:
              advertising helps predict sales; sales do not help predict advertising. Feedback means budgets follow
              sales and also lift later sales.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="info" title="No extra predictive content at this p">
            <p>Try a longer lag if the channel is delayed, or a stronger coefficient. Absence of Granger is not absence of a real-world link.</p>
          </Verdict>
        )}
        <Callout>
          It is a statement about forecasts, not about true physical or moral cause. The test cannot see the mechanism.
        </Callout>
      </div>
    </div>
  );
}
