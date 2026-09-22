import { useMemo, useState } from "react";
import { ema, holt, holtWinters, sesForecast, sma, wma } from "@/lib/ts/smooth";
import { simulate } from "@/lib/ts/sim";
import { mae, rmse } from "@/lib/ts/metrics";
import { LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Verdict } from "./ui";

type World = "flat" | "jump" | "trend" | "season" | "multi";
type Method = "sma" | "wma" | "ema" | "ses" | "holt" | "hw";

export function ChSmooth() {
  const [world, setWorld] = useState<World>("season");
  const [method, setMethod] = useState<Method>("hw");
  const [n, setN] = useState(144);
  const [seed, setSeed] = useState(6);
  const [w, setW] = useState(7);
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.15);
  const [gamma, setGamma] = useState(0.2);
  const [phiDamp, setPhiDamp] = useState(1);
  const [m, setM] = useState(12);
  const [h, setH] = useState(18);
  const [multiHW, setMultiHW] = useState(true);
  const [cut, setCut] = useState(120);

  const full = useMemo(() => {
    if (world === "flat") return simulate("white", n, seed, { sigma: 2 }).map((v) => v + 20);
    if (world === "jump") {
      const y = simulate("white", n, seed, { sigma: 1.4 }).map((v) => v + 18);
      return y.map((v, t) => (t >= 48 ? v + 10 : v));
    }
    if (world === "trend") return simulate("trend", n, seed, { level: 20, slope: 0.18, sigma: 1.4 });
    if (world === "multi") return simulate("multi", n, seed, { level: 30, slope: 0.12, seasonAmp: 5, period: m, sigma: 1.3 });
    return simulate("season", n, seed, { level: 40, slope: 0.08, seasonAmp: 8, period: m, sigma: 1.2 });
  }, [world, n, seed, m]);

  const origin = Math.min(full.length - 4, Math.max(m * 2, cut));
  const y = full.slice(0, origin);
  const hold = full.slice(origin, origin + h);

  const spanAlpha = 2 / (w + 1);

  const result = useMemo(() => {
    if (method === "sma") {
      const fitted = sma(y, w);
      const last = [...fitted].reverse().find((v) => v != null) ?? y[y.length - 1];
      return { fitted, fc: Array(h).fill(last) };
    }
    if (method === "wma") {
      const fitted = wma(y, w);
      const last = [...fitted].reverse().find((v) => v != null) ?? y[y.length - 1];
      return { fitted, fc: Array(h).fill(last) };
    }
    if (method === "ema") {
      const fitted = ema(y, alpha);
      return { fitted, fc: Array(h).fill(fitted[fitted.length - 1]) };
    }
    if (method === "ses") {
      const s = sesForecast(y, alpha, h);
      return { fitted: s.fitted, fc: s.forecast };
    }
    if (method === "holt") {
      const s = holt(y, alpha, beta, h, phiDamp);
      return { fitted: s.fitted, fc: s.forecast };
    }
    const s = holtWinters(y, m, alpha, beta, gamma, h, multiHW);
    return { fitted: s.fitted, fc: s.forecast };
  }, [method, y, w, alpha, beta, gamma, h, m, multiHW, phiDamp]);

  const shown = full.slice(0, origin + hold.length);
  const fitPad = (result.fitted as (number | null)[]).concat(Array(hold.length).fill(null));
  const fcPad = Array(origin).fill(null).concat(result.fc.slice(0, hold.length));
  const maeH = hold.length ? mae(hold, result.fc.slice(0, hold.length)) : 0;
  const rmseH = hold.length ? rmse(hold, result.fc.slice(0, hold.length)) : 0;

  const sesOnTrend = method === "ses" && (world === "trend" || world === "season" || world === "multi");
  const holtOnSeason = method === "holt" && (world === "season" || world === "multi");
  const hwOnFlat = method === "hw" && world === "flat";
  const addOnMulti = method === "hw" && world === "multi" && !multiHW;
  const filterNotForecast = method === "sma" || method === "wma" || method === "ema";

  const formula =
    method === "sma"
      ? `SMA_t(${w}) = (y_t + … + y_{t-${w - 1}}) / ${w}`
      : method === "wma"
        ? "recent points get larger weights; still a finite window"
        : method === "ema" || method === "ses"
          ? `L_t = α y_t + (1-α) L_{t-1}     ŷ_{t+h} = L_t`
          : method === "holt"
            ? "L_t, T_t   ·   ŷ_{t+h} = L_t + h T_t"
            : "L_t, T_t, S_t   ·   replay the wave";

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">7 · Smoothing</p>
          <h2 className="mt-1 font-display text-3xl">A running level, not an AR polynomial.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Two costs you always pay: lag, and the over-smooth vs under-smooth trade. SMA / WMA / EMA are filters.
            SES / Holt / Holt–Winters are a forecasting system with state variables. Same recursion as EMA, extra
            states for slope and season.
          </p>
          <Formula>{formula}</Formula>
        </Panel>

        <Panel title="Match the method to the pieces you can see">
          <div className="mb-3">
            <p className="mb-1 text-xs text-muted-foreground">World</p>
            <Segmented
              value={world}
              onChange={setWorld}
              options={[
                { id: "flat", label: "Level" },
                { id: "jump", label: "Jump" },
                { id: "trend", label: "Trend" },
                { id: "season", label: "Add. season" },
                { id: "multi", label: "Growing season" },
              ]}
            />
          </div>
          <div className="mb-3">
            <p className="mb-1 text-xs text-muted-foreground">Method</p>
            <Segmented
              value={method}
              onChange={setMethod}
              options={[
                { id: "sma", label: "SMA" },
                { id: "wma", label: "WMA" },
                { id: "ema", label: "EMA" },
                { id: "ses", label: "SES" },
                { id: "holt", label: "Holt" },
                { id: "hw", label: "Holt–Winters" },
              ]}
            />
          </div>
          <LinePlot
            series={[
              { name: "observed", y: shown, color: "var(--color-chart-1)" },
              { name: "fitted / filter", y: fitPad, color: "var(--color-chart-3)" },
              { name: "forecast", y: fcPad, color: "var(--color-chart-4)", dashed: true },
            ]}
            splitAt={origin - 1}
          />
        </Panel>

        <Callout>
          EMA (pandas ewm) is a filter. SES is EMA used as a forecast: the level, held constant. Holt adds a slope.
          Holt–Winters adds seasonal factors. When someone says “we used exponential smoothing,” ask: SES, Holt, or
          Holt–Winters? Additive or multiplicative? What m?
        </Callout>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="Window w" value={w} min={2} max={24} step={1} onChange={setW} hint={`EMA span ${w} ⇔ α ≈ ${spanAlpha.toFixed(2)}`} />
            <Knob label="α level" value={alpha} min={0.02} max={0.95} step={0.01} onChange={setAlpha} hint="Near 0: tanker. Near 1: the new point is the truth. 0.99 ≈ random walk." />
            <Knob label="β trend" value={beta} min={0.01} max={0.8} step={0.01} onChange={setBeta} />
            <Knob label="γ season" value={gamma} min={0.01} max={0.8} step={0.01} onChange={setGamma} hint="How fast this January may change from last January." />
            <Knob label="Damping φ" value={phiDamp} min={0.6} max={1} step={0.02} onChange={setPhiDamp} hint="<1 fades the slope. More honest at long h." />
            <Knob label="m" value={m} min={4} max={24} step={1} onChange={setM} />
            <Knob label="Origin (the cut)" value={cut} min={48} max={n - 8} step={1} onChange={setCut} />
            <Knob label="h" value={h} min={6} max={36} step={1} onChange={setH} />
            <Knob label="n" value={n} min={80} max={240} step={8} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Multiplicative HW
              <input type="checkbox" checked={multiHW} onChange={(e) => setMultiHW(e.target.checked)} />
            </label>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Holdout MAE" value={maeH.toFixed(2)} />
          <Stat label="Holdout RMSE" value={rmseH.toFixed(2)} />
        </div>
        {sesOnTrend ? (
          <Verdict tone="bad" title="SES cannot predict growth">
            <p>
              Forecast shape is a horizontal line. On a trending series the forecasts sit systematically below the
              future path. No trend, no season → SES. Trend, no season → Holt. Trend and season → Holt–Winters.
            </p>
          </Verdict>
        ) : holtOnSeason ? (
          <Verdict tone="bad" title="Holt strips the wave">
            <p>
              Forecast is a slope with the seasonal wave ignored. July peaks are treated as noise. Add γ and m, or you
              will miss every calendar peak.
            </p>
          </Verdict>
        ) : addOnMulti ? (
          <Verdict tone="warn" title="Additive season on growing waves">
            <p>
              Seasonal swing scales with the level — typical of growing sales. Use multiplicative Holt–Winters, or log
              first. Same choice as in decomposition.
            </p>
          </Verdict>
        ) : hwOnFlat ? (
          <Verdict tone="warn" title="Three states for a flat line">
            <p>
              You are estimating a slope and twelve seasonal factors that are not there. Extra γ will chase noise.
              Match the method to the components you can see.
            </p>
          </Verdict>
        ) : filterNotForecast ? (
          <Verdict tone="info" title="This is a filter">
            <p>
              SMA equal-weights a finite window (drop-off kinks). WMA hugs turns faster. EMA never fully drops the
              past. The dashed line is “hold the last smoother value,” not a serious forecast family.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="good" title="Method matches the pieces">
            <p>
              Small α is slow to accept a jump and calm on noise. Large α accepts the jump and rides the noise. In
              software α is usually estimated by one-step error — still look at it.
            </p>
          </Verdict>
        )}
      </div>
    </div>
  );
}
