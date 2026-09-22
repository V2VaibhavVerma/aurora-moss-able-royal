import { useMemo, useState } from "react";
import { acf, band, pacf } from "@/lib/ts/acf";
import { identify } from "@/lib/ts/identify";
import { difference, seasonalDiff } from "@/lib/ts/stats";
import { simulate } from "@/lib/ts/sim";
import { AcfBars, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Table, Verdict } from "./ui";

type Truth = "white" | "ar1" | "ar2" | "ma1" | "ma2" | "arma11" | "rw" | "season";

export function ChAcf() {
  const [truth, setTruth] = useState<Truth>("ar1");
  const [n, setN] = useState(280);
  const [seed, setSeed] = useState(2);
  const [phi, setPhi] = useState(0.7);
  const [phi2, setPhi2] = useState(-0.3);
  const [theta, setTheta] = useState(0.65);
  const [m, setM] = useState(12);
  const [d, setD] = useState(0);
  const [Ds, setDs] = useState(0);
  const [maxLag, setMaxLag] = useState(28);

  const raw = useMemo(() => {
    if (truth === "white") return simulate("white", n, seed, { sigma: 1 });
    if (truth === "ar1") return simulate("ar1", n, seed, { phi, sigma: 1 });
    if (truth === "ar2") return simulate("ar2", n, seed, { phi, phi2, sigma: 1 });
    if (truth === "ma1") return simulate("ma1", n, seed, { theta, sigma: 1 });
    if (truth === "ma2") return simulate("ma2", n, seed, { theta, theta2: 0.45, sigma: 1 });
    if (truth === "arma11") return simulate("arma11", n, seed, { phi, theta, sigma: 1 });
    if (truth === "rw") return simulate("rw", n, seed, { sigma: 1 });
    return simulate("season", n, seed, { level: 20, slope: 0.06, seasonAmp: 7, period: m, sigma: 1.1 });
  }, [truth, n, seed, phi, phi2, theta, m]);

  const y = useMemo(() => {
    let z = raw;
    if (d) z = difference(z, d);
    if (Ds) z = seasonalDiff(z, m);
    return z;
  }, [raw, d, Ds, m]);

  const r = acf(y, maxLag);
  const p = pacf(y, Math.min(18, maxLag));
  const hint = identify(y, maxLag, m);
  const b = band(y.length);
  const seasonalLags = m > 1 ? [m, 2 * m, 3 * m].filter((k) => k <= maxLag) : [];

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">9 · ACF and PACF</p>
          <h2 className="mt-1 font-display text-3xl">Total memory versus extra memory.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            ACF at lag k is the ordinary correlation with the series shifted by k — including memory that merely
            travels through the in-between lags. PACF at lag k is that correlation after lags 1…k−1 have been
            partialled out. Memory aid: PACF → P for AR(p). ACF carries the MA(q).
          </p>
          <Formula>
            ρ<sub>k</sub> = Cov(y<sub>t</sub>, y<sub>t−k</sub>) / Var(y<sub>t</sub>) · band ±1.96/√T
          </Formula>
        </Panel>

        <Panel title="Identify from the plots">
          <Segmented
            value={truth}
            onChange={setTruth}
            options={[
              { id: "white", label: "WN" },
              { id: "ar1", label: "AR(1)" },
              { id: "ar2", label: "AR(2)" },
              { id: "ma1", label: "MA(1)" },
              { id: "ma2", label: "MA(2)" },
              { id: "arma11", label: "ARMA" },
              { id: "rw", label: "Walk" },
              { id: "season", label: "Season" },
            ]}
          />
          <div className="mt-4">
            <LinePlot series={[{ name: d || Ds ? "repaired series" : "series", y, color: "var(--color-chart-1)" }]} height={160} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <AcfBars values={r} n={y.length} title="ACF — reads q" highlight={seasonalLags} />
            <AcfBars values={p} n={y.length} title="PACF — reads p" highlight={seasonalLags} />
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            cutoff ACF {hint.acfCut} · cutoff PACF {hint.pacfCut} · band {b.toFixed(2)}
          </p>
        </Panel>

        <Panel title="After the series is stationary">
          <Table
            headers={["Pattern", "Model to try"]}
            rows={[
              ["ACF and PACF both dead", "White noise. Stop."],
              ["PACF cuts off at p; ACF tails off", "AR(p)"],
              ["ACF cuts off at q; PACF tails off", "MA(q)"],
              ["Both tail off", "ARMA(p,q), search small values"],
              ["Slow linear ACF before differencing", "Raise d, usually to 1, and redraw"],
              ["Spikes at multiples of m", "Seasonal terms; maybe D = 1"],
              ["Residual ACF still spiked", "Wrong order, or a season / break remains"],
            ]}
          />
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="True φ" value={phi} min={-0.9} max={0.95} step={0.05} onChange={setPhi} />
            <Knob label="True φ₂" value={phi2} min={-0.8} max={0.6} step={0.05} onChange={setPhi2} hint="AR(2) with opposite signs often oscillates." />
            <Knob label="True θ" value={theta} min={-0.9} max={0.95} step={0.05} onChange={setTheta} />
            <Knob label="d (then read plots)" value={d} min={0} max={2} step={1} onChange={setD} hint="You do not read p and q on a wandering mean." />
            <Knob label="Seasonal D" value={Ds} min={0} max={1} step={1} onChange={setDs} />
            <Knob label="m" value={m} min={4} max={24} step={1} onChange={setM} />
            <Knob label="Max lag" value={maxLag} min={12} max={48} step={1} onChange={setMaxLag} hint="If you look at 40 lags, expect a couple of false spikes." />
            <Knob label="n" value={n} min={80} max={400} step={10} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
          </div>
        </Panel>
        {hint.slowDecay && d === 0 ? (
          <Verdict tone="bad" title="Not suitable to read p, q yet">
            <p>{hint.why}</p>
          </Verdict>
        ) : truth === "season" && Ds === 0 && hint.seasonalLag ? (
          <Verdict tone="warn" title={`m = ${hint.seasonalLag}, not AR(${hint.seasonalLag})`}>
            <p>
              Extra ACF spikes at {m}, {2 * m}, {3 * m} are the calendar. If those spikes themselves die slowly, take a
              seasonal difference. Then read P and Q off the seasonal lags the same way you read p and q off the short
              lags.
            </p>
          </Verdict>
        ) : (
          <Verdict tone={hint.suitable ? "good" : "warn"} title={hint.suggest}>
            <p>{hint.why}</p>
            <p>
              Cutoff means: outside the band up to that lag, then inside and stays there. Tail off means: shrinks
              gradually — a geometric decay or a dying wave, not a cliff.
            </p>
          </Verdict>
        )}
        <Callout>
          Orders: p AR, d differences, q MA, m period, and for SARIMA also P, D, Q at that seasonal lag. Always close
          the loop: fit, then plot residual ACF. If lag 12 is still standing, you did not finish the seasonal part.
        </Callout>
      </div>
    </div>
  );
}
