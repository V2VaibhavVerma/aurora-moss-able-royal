import { useMemo, useState } from "react";
import { acf } from "@/lib/ts/acf";
import { simulate } from "@/lib/ts/sim";
import {
  boxCox,
  difference,
  halvesMoments,
  linearDetrend,
  maDetrend,
  rolling,
  seasonalDiff,
  stationarityCall,
  stdev,
} from "@/lib/ts/stats";
import { mean } from "@/lib/forecast/math";
import { AcfBars, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Table, Verdict } from "./ui";

type World = "white" | "ar" | "rw" | "trend" | "multi" | "i2";

export function ChStationarity() {
  const [world, setWorld] = useState<World>("rw");
  const [n, setN] = useState(200);
  const [seed, setSeed] = useState(5);
  const [phi, setPhi] = useState(0.7);
  const [d, setD] = useState(0);
  const [Ds, setDs] = useState(0);
  const [lam, setLam] = useState(1);
  const [detrend, setDetrend] = useState<"none" | "linear" | "ma">("none");
  const [win, setWin] = useState(20);
  const [period, setPeriod] = useState(12);
  const [trendTerm, setTrendTerm] = useState(false);

  const raw = useMemo(() => {
    if (world === "white") return simulate("white", n, seed, { sigma: 1 });
    if (world === "ar") return simulate("ar1", n, seed, { phi, sigma: 1 });
    if (world === "rw") return simulate("rw", n, seed, { sigma: 1 });
    if (world === "trend") return simulate("trend", n, seed, { level: 10, slope: 0.12, sigma: 1 });
    if (world === "multi") return simulate("multi", n, seed, { level: 20, slope: 0.12, seasonAmp: 5, period, sigma: 1.2 });
    const once = simulate("rwdrift", n, seed, { drift: 0.04, sigma: 0.7 });
    const out: number[] = [20];
    for (let t = 1; t < n; t++) out.push(out[t - 1] + once[t] * 0.15);
    return out;
  }, [world, n, seed, phi, period]);

  const repaired = useMemo(() => {
    let z = raw.slice();
    if (lam !== 1) z = boxCox(z, lam);
    if (detrend === "linear") z = linearDetrend(z).resid;
    if (detrend === "ma") z = maDetrend(z, win).resid;
    if (d > 0) z = difference(z, d);
    if (Ds > 0) z = seasonalDiff(z, period);
    return z;
  }, [raw, lam, detrend, win, d, Ds, period]);

  const testsRaw = useMemo(() => stationarityCall(raw), [raw]);
  const tests = useMemo(() => stationarityCall(repaired), [repaired]);
  const adfUse = trendTerm ? tests.adfTrend : tests.adf;
  const kpssUse = trendTerm ? tests.kpssTrend : tests.kpss;
  const rMean = rolling(repaired, Math.max(8, Math.floor(repaired.length / 10)), mean);
  const rSd = rolling(repaired, Math.max(8, Math.floor(repaired.length / 10)), stdev);
  const r = acf(repaired, 24);
  const h = halvesMoments(repaired);
  const overDiff = world === "white" && d >= 1;

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">4 · Stationarity</p>
          <h2 className="mt-1 font-display text-3xl">Same rules in 2021 as in 2015.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A model estimated on one window is asked to speak about another. That only works if mean, variance, and
            lag-k correlation do not depend on the date. Weak (covariance) stationarity is what ARMA assumes. Strict
            stationarity is almost never testable. ARIMA’s “I” is: change the series until the assumption is plausible.
          </p>
          <Formula>E(y<sub>t</sub>)=μ · Var(y<sub>t</sub>)=σ² · Cov(y<sub>t</sub>, y<sub>t−k</sub>)=γ<sub>k</sub></Formula>
        </Panel>

        <Panel title="World, then repair">
          <Segmented
            value={world}
            onChange={setWorld}
            options={[
              { id: "white", label: "White" },
              { id: "ar", label: "AR(1)" },
              { id: "rw", label: "Random walk" },
              { id: "trend", label: "Line + noise" },
              { id: "multi", label: "Growing season" },
              { id: "i2", label: "I(2)" },
            ]}
          />
          <div className="mt-4">
            <LinePlot
              series={[
                { name: "repaired series", y: repaired, color: "var(--color-chart-1)" },
                { name: "rolling mean", y: rMean, color: "var(--color-chart-4)", dashed: true },
                { name: "rolling std", y: rSd, color: "var(--color-chart-3)", dashed: true },
              ]}
            />
          </div>
          <div className="mt-3">
            <AcfBars values={r} n={repaired.length} title="ACF after the repair" />
          </div>
        </Panel>

        <Panel title="ADF and KPSS disagree on purpose">
          <Table
            headers={["Test", "Null", "Statistic", "5% crit", "Decision"]}
            rows={[
              [
                adfUse.label,
                "unit root",
                adfUse.tstat.toFixed(2),
                String(adfUse.crit),
                adfUse.rejectUnitRoot ? "reject H0 → stationary-ish" : "fail to reject unit root",
              ],
              [
                kpssUse.label,
                "stationary",
                kpssUse.eta.toFixed(3),
                String(kpssUse.crit),
                kpssUse.rejectStationary ? "reject H0 → not stationary" : "fail to reject stationary",
              ],
            ]}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={trendTerm} onChange={(e) => setTrendTerm(e.target.checked)} />
            Run tests with a trend term (use this when the plot climbs)
          </label>
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Repair knobs">
          <div className="space-y-4">
            <Knob label="φ (AR world)" value={phi} min={-0.95} max={1.05} step={0.05} onChange={setPhi} hint="|φ|<1 mean-reverts. φ=1 is a random walk. |φ|>1 explodes." />
            <Knob label="Box–Cox λ" value={lam} min={-0.5} max={1.5} step={0.1} onChange={setLam} hint="1 = do nothing. 0 = log. Attacks variance, not a unit root." />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">De-trend</p>
              <Segmented
                value={detrend}
                onChange={setDetrend}
                options={[
                  { id: "none", label: "None" },
                  { id: "linear", label: "Linear" },
                  { id: "ma", label: "Moving avg" },
                ]}
              />
            </div>
            <Knob label="MA window" value={win} min={6} max={48} step={2} onChange={setWin} />
            <Knob label="Differences d" value={d} min={0} max={2} step={1} onChange={setD} hint="d=2 is for a wandering slope. d>2 is usually a log or a break." />
            <Knob label="Seasonal D" value={Ds} min={0} max={1} step={1} onChange={setDs} />
            <Knob label="Period m" value={period} min={4} max={24} step={1} onChange={setPeriod} />
            <Knob label="n" value={n} min={80} max={360} step={10} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Half-A mean" value={h.meanA.toFixed(2)} />
          <Stat label="Half-B mean" value={h.meanB.toFixed(2)} />
          <Stat label="Half-A sd" value={h.sdA.toFixed(2)} />
          <Stat label="Half-B sd" value={h.sdB.toFixed(2)} />
        </div>
        {overDiff ? (
          <Verdict tone="bad" title="Over-differenced">
            <p>
              The raw world was already stationary. Differencing “to be safe” manufactures MA structure and throws away
              the level. Stop as soon as rolling mean/std hold and ACF dies quickly.
            </p>
          </Verdict>
        ) : world === "trend" && d >= 1 && detrend === "none" ? (
          <Verdict tone="warn" title="A line is not a random walk">
            <p>
              Differencing a deterministic trend works (Δ(a+bt)=b) but is blunt — it creates MA structure you then
              model. If you know the trend is a straight line, subtract the line. ADF with a trend term is how you ask
              which world you are in.
            </p>
          </Verdict>
        ) : world === "multi" && lam === 1 && d === 0 ? (
          <Verdict tone="warn" title="Variance is climbing with the level">
            <p>
              Log or Box–Cox first. A transform does not remove a unit root by itself. You often log, then difference.
              If you intend to forecast the season, keep it for SARIMA / Holt–Winters instead of throwing it away.
            </p>
          </Verdict>
        ) : tests.call === "stationary" ? (
          <Verdict tone="good" title="Allowed into ARMA">
            <p>{tests.why}</p>
            <p>Then, and only then, read ACF/PACF for p and q.</p>
          </Verdict>
        ) : (
          <Verdict tone={tests.call === "unit root" ? "bad" : "warn"} title={tests.call}>
            <p>{tests.why}</p>
            <p>Raw-series reading (no repair): {testsRaw.call}.</p>
          </Verdict>
        )}
        <Callout>
          Fail-to-reject ADF is not proof of a unit root. φ = 0.97 looks a lot like φ = 1. Always pair the test with
          the plot.
        </Callout>
      </div>
    </div>
  );
}
