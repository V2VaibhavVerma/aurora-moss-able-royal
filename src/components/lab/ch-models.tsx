import { useMemo, useState } from "react";
import { acf, ljungBox } from "@/lib/ts/acf";
import { forecastARIMA, forecastSARIMA, gridARIMA, invertMA1, stationaryAR1 } from "@/lib/ts/arima";
import { identify, residualVerdict } from "@/lib/ts/identify";
import { bivariateVAR, simulate } from "@/lib/ts/sim";
import { difference, seasonalDiff } from "@/lib/ts/stats";
import { AcfBars, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Table, Verdict } from "./ui";

type Truth = "white" | "ar1" | "ar2" | "ma1" | "ma2" | "arma11" | "rw" | "season";

export function ChModels() {
  const [tab, setTab] = useState<"uni" | "sarima" | "var">("uni");
  const [truth, setTruth] = useState<Truth>("ar1");
  const [n, setN] = useState(220);
  const [seed, setSeed] = useState(8);
  const [phi, setPhi] = useState(0.7);
  const [phi2, setPhi2] = useState(-0.25);
  const [theta, setTheta] = useState(0.6);
  const [p, setP] = useState(1);
  const [d, setD] = useState(0);
  const [q, setQ] = useState(0);
  const [P, setPs] = useState(0);
  const [D, setDs] = useState(1);
  const [Q, setQs] = useState(1);
  const [m, setM] = useState(12);
  const [h, setH] = useState(24);
  const [axy, setAxy] = useState(0);
  const [ayx, setAyx] = useState(0.6);

  const y = useMemo(() => {
    if (truth === "white") return simulate("white", n, seed, { sigma: 1 });
    if (truth === "ar1") return simulate("ar1", n, seed, { phi, sigma: 1 });
    if (truth === "ar2") return simulate("ar2", n, seed, { phi, phi2, sigma: 1 });
    if (truth === "ma1") return simulate("ma1", n, seed, { theta, sigma: 1 });
    if (truth === "ma2") return simulate("ma2", n, seed, { theta, theta2: 0.4, sigma: 1 });
    if (truth === "arma11") return simulate("arma11", n, seed, { phi, theta, sigma: 1 });
    if (truth === "rw") return simulate("rw", n, seed, { sigma: 1 });
    return simulate("season", n, seed, { level: 40, slope: 0.08, seasonAmp: 8, period: m, sigma: 1.2 });
  }, [truth, n, seed, phi, phi2, theta, m]);

  const { fit, fc } = useMemo(() => {
    if (tab === "sarima") return forecastSARIMA(y, p, d, q, P, D, Q, m, h);
    return forecastARIMA(y, p, d, q, h);
  }, [tab, y, p, d, q, P, D, Q, m, h]);
  const hint = useMemo(() => {
    let z = y;
    if (tab === "sarima" && D > 0 && m > 1) z = seasonalDiff(z, m);
    if (d > 0) z = difference(z, d);
    return identify(z, 24, m);
  }, [tab, y, m, d, D]);
  const rv = residualVerdict(fit.resid);
  const grid = useMemo(() => gridARIMA(y, d, 2, 2), [y, d]);
  const rRes = acf(fit.resid, 18);
  const lb = ljungBox(fit.resid, 12);

  const shown = y.concat(Array(h).fill(null));
  const fcline = Array(y.length).fill(null).concat(fc);

  const pair = useMemo(() => bivariateVAR(n, seed, axy, ayx, 1), [n, seed, axy, ayx]);

  const eq =
    tab === "var"
      ? "y_t = a + Φ11 y_{t-1} + Φ12 x_{t-1} + ε"
      : tab === "sarima"
        ? `φ(B) Φ(B^m) (1-B)^d (1-B^m)^D y_t = θ(B) Θ(B^m) ε_t`
        : d > 0
          ? `φ(B)(1-B)^${d} y_t = c + θ(B) ε_t`
          : "y_t = c + φ1 y_{t-1} + … + ε_t + θ1 ε_{t-1} + …";

  const wrongD = truth === "rw" && d === 0;
  const wrongAR = truth === "ma1" && p >= 1 && q === 0;
  const wrongMA = truth === "ar1" && q >= 1 && p === 0;
  const arOk = stationaryAR1(phi);
  const maOk = invertMA1(theta);
  const seasonalMiss = tab === "sarima" && truth === "season" && D === 0;
  const seasonalOk = tab === "sarima" && truth === "season" && D === 1;
  const airline = p === 0 && d === 1 && q === 1 && P === 0 && D === 1 && Q === 1;

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">6 · Forecasting models</p>
          <h2 className="mt-1 font-display text-3xl">What does it remember?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Past values → AR (VAR). Past shocks → MA (VMA). Both → ARMA. Calendar lag m → seasonal block. Nothing →
            white noise. Last value perfectly, φ=1 → random walk. Several series → the vector family.
          </p>
          <Formula>{eq}</Formula>
        </Panel>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "uni", label: "AR / MA / ARIMA" },
            { id: "sarima", label: "SARIMA" },
            { id: "var", label: "VAR / VMA" },
          ]}
        />

        {tab !== "var" ? (
          <>
            <Panel title="Truth process vs the model you fit">
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
                  { id: "rw", label: "RW" },
                  { id: "season", label: "Season" },
                ]}
              />
              {tab === "sarima" ? (
                <button
                  type="button"
                  className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => {
                    setTruth("season");
                    setP(0);
                    setD(1);
                    setQ(1);
                    setPs(0);
                    setDs(1);
                    setQs(1);
                    setM(12);
                  }}
                >
                  Try the airline model (0,1,1)(0,1,1)<sub>12</sub>
                </button>
              ) : null}
              <div className="mt-4">
                <LinePlot
                  series={[
                    { name: "observed", y: shown, color: "var(--color-chart-1)" },
                    { name: "fitted", y: fit.origFitted, color: "var(--color-chart-3)", dashed: true },
                    { name: "forecast", y: fcline, color: "var(--color-chart-4)" },
                  ]}
                  splitAt={y.length - 1}
                />
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                You fit {tab === "sarima" ? "SARIMA" : "ARIMA"}({p},{d},{q})
                {tab === "sarima" ? `(${P},${D},{Q})_${m}` : ""} · plots suggest {hint.suggest}
              </p>
            </Panel>
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel>
                <AcfBars values={rRes} n={fit.resid.length} title="Residual ACF — must be dead" />
              </Panel>
              <Panel title="AIC search at this d">
                <Table
                  headers={["(p,d,q)", "AIC", "BIC"]}
                  rows={grid.slice(0, 6).map((g) => [`(${g.p},${g.d},${g.q})`, g.aic.toFixed(1), g.bic.toFixed(1)])}
                  highlight={0}
                />
              </Panel>
            </div>
          </>
        ) : (
          <Panel title="Two series, off-diagonal memory">
            <LinePlot
              series={[
                { name: "x (driver if Φ_yx > 0)", y: pair.x, color: "var(--color-chart-1)" },
                { name: "y (follower)", y: pair.y, color: "var(--color-chart-4)" },
              ]}
            />
            <Callout>
              VAR(p): each variable on p lags of all variables. VMA is the shock-spill representation (impulse
              responses). VARMA is flexible and painful. VARIMA differences the vector first — unless series wander
              together, in which case differencing independently throws away cointegration. Keep k small: k²p slopes.
            </Callout>
          </Panel>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            {tab !== "var" ? (
              <>
                <Knob label="Your p (AR)" value={p} min={0} max={4} step={1} onChange={setP} hint="PACF cutoff." />
                <Knob label="Your d (I)" value={d} min={0} max={2} step={1} onChange={setD} hint="Do not read p,q until d is right." />
                <Knob label="Your q (MA)" value={q} min={0} max={4} step={1} onChange={setQ} hint="ACF cutoff." />
                {tab === "sarima" ? (
                  <>
                    <Knob label="P seasonal AR" value={P} min={0} max={1} step={1} onChange={setPs} hint="Lag m on the series." />
                    <Knob label="D seasonal diff" value={D} min={0} max={1} step={1} onChange={setDs} hint="y_t − y_{t−m}. This is the July-minus-July move." />
                    <Knob label="Q seasonal MA" value={Q} min={0} max={1} step={1} onChange={setQs} hint="Lag m on the shock." />
                    <Knob label="m" value={m} min={4} max={24} step={1} onChange={setM} />
                  </>
                ) : null}
                <Knob label="True φ" value={phi} min={-0.9} max={1.05} step={0.05} onChange={setPhi} />
                <Knob label="True φ₂" value={phi2} min={-0.8} max={0.8} step={0.05} onChange={setPhi2} />
                <Knob label="True θ" value={theta} min={-0.9} max={0.95} step={0.05} onChange={setTheta} />
              </>
            ) : (
              <>
                <Knob label="Φ_xy  (y → x)" value={axy} min={-0.8} max={0.8} step={0.05} onChange={setAxy} hint="Yesterday's y in today's x." />
                <Knob label="Φ_yx  (x → y)" value={ayx} min={-0.8} max={0.8} step={0.05} onChange={setAyx} hint="Yesterday's x in today's y. This is the Granger door." />
              </>
            )}
            <Knob label="n" value={n} min={80} max={360} step={10} onChange={setN} />
            <Knob label="h" value={h} min={6} max={48} step={2} onChange={setH} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Ljung–Box p" value={lb.p.toFixed(3)} />
          <Stat label="AIC" value={fit.aic.toFixed(1)} />
        </div>
        {tab === "var" ? (
          Math.abs(ayx) < 0.1 && Math.abs(axy) < 0.1 ? (
            <Verdict tone="info" title="Two univariate series wearing a costume">
              <p>Off-diagonals near 0. A VAR here is just two AR(1)s. Univariate ARIMA would not leave a channel on the table.</p>
            </Verdict>
          ) : (
            <Verdict tone="good" title="A lagged channel exists">
              <p>
                Red is being pulled by blue (or the reverse). A univariate ARIMA on the follower leaves that channel
                unused. Next chapter: test it formally with Granger.
              </p>
            </Verdict>
          )
        ) : seasonalMiss ? (
          <Verdict tone="bad" title="Not suitable — the calendar is still in the leftover">
            <p>
              A yearly wave is not AR({m}). Raise D to 1: that is last July minus this July. Then read P and Q off the
              seasonal lags the same way you read p and q off the short lags. Residual: {rv.text}
            </p>
          </Verdict>
        ) : seasonalOk && airline ? (
          <Verdict tone="good" title="Airline model — the classic seasonal workhorse">
            <p>
              (0,1,1)(0,1,1)<sub>12</sub> differences the level and the calendar, then lets a short shock spill one
              month and one year. Residuals: {rv.text} Ljung–Box p = {lb.p.toFixed(3)}.
            </p>
          </Verdict>
        ) : seasonalOk ? (
          <Verdict tone="good" title="Seasonal difference is doing the heavy lift">
            <p>
              D = 1 took out the yearly jump. P and Q at lag m mop whatever calendar memory remains. If lag {m} is
              still standing in residual ACF, raise Q. Residual: {rv.text}
            </p>
          </Verdict>
        ) : wrongD ? (
          <Verdict tone="bad" title="Not suitable — difference first">
            <p>
              {hint.why} Fitting ARIMA({p},0,{q}) on a random walk is the classic mistake. ARIMA(0,1,0) is the honest
              model.
            </p>
          </Verdict>
        ) : wrongAR ? (
          <Verdict tone="bad" title="You put the memory on the wrong side">
            <p>
              Truth is MA(1): a shock spills one period. PACF tails off; ACF cuts off at 1. An AR(p) will need many lags
              to approximate a short MA. Residual: {rv.text}
            </p>
          </Verdict>
        ) : wrongMA ? (
          <Verdict tone="bad" title="MA cannot replace a persistent AR">
            <p>
              Truth is AR(1). PACF cuts off at 1; ACF tails off. An MA(q) is always stationary but has short memory in
              the innovations. Residual: {rv.text}
            </p>
          </Verdict>
        ) : !arOk && truth.startsWith("ar") ? (
          <Verdict tone="bad" title="AR polynomial is explosive">
            <p>{"|φ| ≥ 1. Roots must sit outside the unit circle. This is no longer a stationary AR."}</p>
          </Verdict>
        ) : !maOk && truth.startsWith("ma") ? (
          <Verdict tone="warn" title="Not invertible">
            <p>
              {"|θ| ≥ 1. Two MA models can share an ACF; you want the invertible one so shocks are recoverable from past y."}
            </p>
          </Verdict>
        ) : rv.ok ? (
          <Verdict tone="good" title="Residuals look like leftover ignorance">
            <p>
              {rv.text} Ljung–Box p = {lb.p.toFixed(3)}. A small model with white residuals beats a large ARMA that
              fits the past and fails the future.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="warn" title="Unfinished">
            <p>{rv.text}</p>
            <p>Plots on the raw series: {hint.why}</p>
          </Verdict>
        )}
      </div>
    </div>
  );
}
