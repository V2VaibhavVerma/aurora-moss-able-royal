import { useMemo, useState } from "react";
import { classicalDecompose, leftoverSeason } from "@/lib/ts/decomp";
import { simulate } from "@/lib/ts/sim";
import { DecompGrid, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Verdict } from "./ui";

export function ChDecomp() {
  const [n, setN] = useState(168);
  const [seed, setSeed] = useState(4);
  const [slope, setSlope] = useState(0.14);
  const [amp, setAmp] = useState(8);
  const [period, setPeriod] = useState(12);
  const [cycleAmp, setCycleAmp] = useState(0);
  const [cycleLen, setCycleLen] = useState(48);
  const [sigma, setSigma] = useState(1.2);
  const [gen, setGen] = useState<"add" | "multi">("add");
  const [model, setModel] = useState<"add" | "multi">("add");
  const [showPieces, setShowPieces] = useState(false);

  const y = useMemo(() => {
    if (gen === "multi") {
      return simulate("multi", n, seed, { level: 40, slope, seasonAmp: amp / 4, period, sigma, cycleAmp, cycleLen });
    }
    return simulate("cycle", n, seed, { level: 80, slope, seasonAmp: amp, period, sigma, cycleAmp, cycleLen });
  }, [gen, n, seed, slope, amp, period, sigma, cycleAmp, cycleLen]);

  const pieces = useMemo(() => classicalDecompose(y, period, model === "multi"), [y, period, model]);
  const leak = leftoverSeason(pieces.resid, period);
  const mismatch = gen !== model;

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">2 · Decomposition</p>
          <h2 className="mt-1 font-display text-3xl">The number you see is several things stacked.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Decomposition is not a forecast. It is a way of seeing. After you can see the pieces, you decide whether
            Holt–Winters, SARIMA, a log, or a difference is the next tool.
          </p>
          <Formula>
            {model === "add" ? (
              <>y<sub>t</sub> = Trend + Season + Cycle + Residual</>
            ) : (
              <>y<sub>t</sub> = Trend × Season × Cycle × Residual</>
            )}
          </Formula>
        </Panel>

        <Panel title="Build a series, then take it apart">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Generate</span>
            <Segmented value={gen} onChange={setGen} options={[{ id: "add", label: "Additive world" }, { id: "multi", label: "Multiplicative world" }]} />
          </div>
          <LinePlot
            series={[
              { name: "observed", y, color: "var(--color-chart-1)" },
              { name: "classical trend", y: pieces.trend, color: "var(--color-chart-4)", dashed: true },
            ]}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showPieces} onChange={(e) => setShowPieces(e.target.checked)} />
            Season vs cycle vs leftover (the four-panel)
          </label>
        </Panel>

        {showPieces ? (
          <DecompGrid observed={y} trend={pieces.trend} seasonal={pieces.seasonal} resid={pieces.resid} />
        ) : (
          <Callout>
            Trend is the slow drift — this July versus July five years ago. Season is a pattern you can name from a
            calendar (12 months, 7 days, 24 hours). A cycle also rises and falls, but you cannot mark the date in
            advance. Residuals are not the unimportant part. They are how you know whether you are finished.
          </Callout>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="Trend slope" value={slope} min={0} max={0.45} step={0.01} onChange={setSlope} hint="Trend is not the yearly July bump." />
            <Knob label="Season amplitude" value={amp} min={0} max={24} step={0.5} onChange={setAmp} />
            <Knob label="Period m" value={period} min={4} max={24} step={1} onChange={setPeriod} hint="Known before you model. That is what makes it season." />
            <Knob label="Cycle amplitude" value={cycleAmp} min={0} max={18} step={0.5} onChange={setCycleAmp} hint="Business / credit cycle — length moves." />
            <Knob label="Cycle length" value={cycleLen} min={24} max={96} step={4} onChange={setCycleLen} />
            <Knob label="Residual σ" value={sigma} min={0.2} max={5} step={0.1} onChange={setSigma} />
            <Knob label="Seed" value={seed} min={1} max={40} step={1} onChange={setSeed} />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Decomposition model</p>
              <Segmented value={model} onChange={setModel} options={[{ id: "add", label: "Additive" }, { id: "multi", label: "Multiplicative" }]} />
            </div>
          </div>
        </Panel>
        <Stat label="Leftover season" value={leak.toFixed(3)} hint="Share of residual variance that still has a calendar shape." />
        {mismatch ? (
          <Verdict tone="bad" title="Wrong flavour — season leaks">
            <p>
              You generated a {gen === "add" ? "constant-height" : "percent"} season and decomposed it as{" "}
              {model === "add" ? "additive" : "multiplicative"}. Classical season is forced to one height (or one
              ratio). The leftover yearly rhythm sits in the residual. Leftover-season score {leak.toFixed(2)}.
            </p>
            <p>Fix: match the model to the waves, or take logs and then treat the result as additive.</p>
          </Verdict>
        ) : leak > 0.12 ? (
          <Verdict tone="warn" title="The residual is unfinished">
            <p>
              Period, cycle, or noise is still structured. A cycle on a short monthly series looks like a slow bend in
              the trend — do not force a cycle component just because the slide lists the word.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="good" title="Residual is close to unstructured">
            <p>
              Additive when the July bump is about +20 units every year. Multiplicative when July is about 25% above
              the local trend. Getting it wrong leaks season into the residual or into the trend.
            </p>
          </Verdict>
        )}
      </div>
    </div>
  );
}
