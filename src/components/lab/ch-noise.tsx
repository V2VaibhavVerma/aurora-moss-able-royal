import { useMemo, useState } from "react";
import { acf, ljungBox, pacf } from "@/lib/ts/acf";
import { simulate } from "@/lib/ts/sim";
import { difference, stationarityCall } from "@/lib/ts/stats";
import { AcfBars, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Table, Verdict } from "./ui";

type Kind = "white" | "rw" | "rwdrift" | "ar";

export function ChNoise() {
  const [kind, setKind] = useState<Kind>("white");
  const [n, setN] = useState(240);
  const [seed, setSeed] = useState(11);
  const [sigma, setSigma] = useState(1);
  const [phi, setPhi] = useState(0.5);
  const [drift, setDrift] = useState(0.08);
  const [diffOnce, setDiffOnce] = useState(false);
  const [h, setH] = useState(40);

  const raw = useMemo(() => {
    if (kind === "white") return simulate("white", n, seed, { sigma });
    if (kind === "rw") return simulate("rw", n, seed, { sigma });
    if (kind === "rwdrift") return simulate("rwdrift", n, seed, { sigma, drift });
    return simulate("ar1", n, seed, { phi, sigma });
  }, [kind, n, seed, sigma, phi, drift]);

  const y = diffOnce ? difference(raw, 1) : raw;
  const r = acf(y, 24);
  const p = pacf(y, 16);
  const lb = ljungBox(y, 12);
  const tests = stationarityCall(y);

  const last = raw[raw.length - 1] ?? 0;
  const fc = Array.from({ length: n + h }, (_, i) => (i < n ? null : kind === "white" ? 0 : last + (kind === "rwdrift" ? drift * (i - n + 1) : 0)));
  const lo = fc.map((v, i) => (v == null ? null : v - 1.96 * sigma * Math.sqrt(kind === "white" ? 1 : i - n + 1)));
  const hi = fc.map((v, i) => (v == null ? null : v + 1.96 * sigma * Math.sqrt(kind === "white" ? 1 : i - n + 1)));
  const shown = raw.concat(Array(h).fill(null));

  const isWN = kind === "white" || (diffOnce && kind !== "ar");
  const isRW = kind === "rw" || kind === "rwdrift";

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">5 · White noise and random walk</p>
          <h2 className="mt-1 font-display text-3xl">The same shocks, stacked or not.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every later model is “what we observe = something the model can explain + ε<sub>t</sub>”. ε<sub>t</sub> is
            supposed to be white noise. If the leftover is not, the model is unfinished. A random walk is those shocks
            added up. That is why a random walk is ARIMA(0,1,0).
          </p>
          <Formula>
            {kind === "white" ? (
              <>y<sub>t</sub> = ε<sub>t</sub></>
            ) : kind === "rw" ? (
              <>y<sub>t</sub> = y<sub>t−1</sub> + ε<sub>t</sub></>
            ) : kind === "rwdrift" ? (
              <>y<sub>t</sub> = μ + y<sub>t−1</sub> + ε<sub>t</sub></>
            ) : (
              <>y<sub>t</sub> = φ y<sub>t−1</sub> + ε<sub>t</sub></>
            )}
          </Formula>
        </Panel>

        <Panel title="Four views, never one number">
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { id: "white", label: "White noise" },
              { id: "ar", label: "AR(1) φ" },
              { id: "rw", label: "Random walk" },
              { id: "rwdrift", label: "Walk + drift" },
            ]}
          />
          <div className="mt-4">
            <LinePlot
              series={[
                { name: "observed", y: shown, color: "var(--color-chart-1)" },
                { name: "point forecast", y: fc, color: "var(--color-chart-4)", dashed: true },
              ]}
              splitAt={n - 1}
              bandLo={lo}
              bandHi={hi}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AcfBars values={r} n={y.length} title={diffOnce ? "ACF of Δy" : "ACF"} />
            <AcfBars values={p} n={y.length} title="PACF" />
          </div>
        </Panel>

        <Panel title="The identity that justifies differencing">
          <Table
            headers={["", "White noise", "Random walk"]}
            rows={[
              ["Stationary?", "Yes", "No — Var(y_t)=t σ²"],
              ["ACF", "Dead after 0", "Slow slide from 1"],
              ["Best forecast", "The mean (usually 0)", "Last value (plus μh if drift)"],
              ["Long horizon", "Nothing useful", "Point stays; interval grows like √h"],
            ]}
          />
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="σ" value={sigma} min={0.3} max={3} step={0.1} onChange={setSigma} />
            <Knob label="φ (AR world)" value={phi} min={0} max={1.05} step={0.05} onChange={setPhi} hint="0.5 forgets. 0.9 is sticky. 1.0 has no home." />
            <Knob label="Drift μ" value={drift} min={0} max={0.3} step={0.01} onChange={setDrift} />
            <Knob label="n" value={n} min={80} max={400} step={10} onChange={setN} />
            <Knob label="Forecast h" value={h} min={10} max={80} step={5} onChange={setH} />
            <Knob label="Seed" value={seed} min={1} max={40} step={1} onChange={setSeed} />
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Difference once
              <input type="checkbox" checked={diffOnce} onChange={(e) => setDiffOnce(e.target.checked)} />
            </label>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Ljung–Box Q" value={lb.q.toFixed(1)} />
          <Stat label="p-value" value={lb.p.toFixed(3)} hint={lb.p < 0.05 ? "still correlated" : "compatible with WN"} />
          <Stat label="ADF/KPSS" value={tests.call} />
          <Stat label="ρ₁" value={(r[1] ?? 0).toFixed(2)} />
        </div>
        {isRW && !diffOnce ? (
          <Verdict tone="bad" title="Do not fit AR(20)">
            <p>
              Nearby values share almost the same pile of past shocks, so they are extremely correlated. Difference
              once: Δy<sub>t</sub> = ε<sub>t</sub>. You did not invent a clever model. You took the extra memory out by
              subtracting yesterday.
            </p>
          </Verdict>
        ) : isWN ? (
          <Verdict tone="good" title="Unforecastable from its own past">
            <p>
              Best forecast of ε<sub>t+1</sub> is 0. Raw data already white → stop. ARIMA residuals white → the
              univariate structure is finished. Ljung–Box p = {lb.p.toFixed(3)}.
            </p>
          </Verdict>
        ) : kind === "ar" && phi >= 0.95 ? (
          <Verdict tone="warn" title="The boundary of AR(1)">
            <p>
              {"|φ| < 1 pulled back to a mean. φ = 1 the pullback dies. You are standing on that step. ADF has low power here on purpose."}
            </p>
          </Verdict>
        ) : (
          <Verdict tone="info" title="Mean-reverting, still stationary">
            <p>
              Today keeps {Math.round(phi * 100)}% of yesterday’s deviation, then adds noise. There is momentum, but
              there is still a long-run mean. This is the process ARIMA is allowed to eat without differencing.
            </p>
          </Verdict>
        )}
        <Callout>
          One realised path of a driftless random walk looks like a story. Across imaginary worlds the mean stays at
          0. Students mix those two things up because they only ever see one path.
        </Callout>
      </div>
    </div>
  );
}
