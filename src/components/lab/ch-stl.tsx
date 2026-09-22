import { useMemo, useState } from "react";
import { classicalDecompose, leftoverSeason, stlLite } from "@/lib/ts/decomp";
import { injectOutlier, simulate } from "@/lib/ts/sim";
import { DecompGrid, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Table, Verdict } from "./ui";

export function ChStl() {
  const [n, setN] = useState(180);
  const [seed, setSeed] = useState(9);
  const [period, setPeriod] = useState(12);
  const [slope, setSlope] = useState(0.16);
  const [amp, setAmp] = useState(7);
  const [seasSpan, setSeasSpan] = useState(0.4);
  const [trendSpan, setTrendSpan] = useState(0.45);
  const [robust, setRobust] = useState(true);
  const [outlier, setOutlier] = useState(18);
  const [world, setWorld] = useState<"stable" | "growing" | "break">("growing");
  const [view, setView] = useState<"obs" | "class" | "stl">("obs");

  const raw = useMemo(() => {
    if (world === "stable") return simulate("season", n, seed, { level: 70, slope: 0.04, seasonAmp: amp, period, sigma: 1.1 });
    if (world === "break") {
      const y = simulate("season", n, seed, { level: 60, slope: 0.08, seasonAmp: amp, period, sigma: 1.2 });
      return injectOutlier(y, Math.floor(n * 0.55), outlier);
    }
    return simulate("multi", n, seed, { level: 35, slope, seasonAmp: amp / 3.5, period, sigma: 1.3 });
  }, [world, n, seed, amp, period, slope, outlier]);

  const klass = useMemo(() => classicalDecompose(raw, period, false), [raw, period]);
  const stl = useMemo(
    () => stlLite(raw, period, seasSpan, trendSpan, robust),
    [raw, period, seasSpan, trendSpan, robust],
  );
  const leakC = leftoverSeason(klass.resid, period);
  const leakS = leftoverSeason(stl.resid, period);

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">3 · STL</p>
          <h2 className="mt-1 font-display text-3xl">LOESS twice, then whatever is left.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A seasonal smoother at lag m (each January with other Januarys) and a trend smoother on the seasonally
            adjusted series. It iterates. Native STL is additive — for multiplicative data, decompose log y, then
            exponentiate. STL does not produce next year’s July. Holt–Winters and SARIMA do.
          </p>
          <Formula>seasonal LOESS at lag m  →  trend LOESS  →  residual = leftover</Formula>
        </Panel>

        <Panel title="Classical additive vs STL, same series">
          <Segmented
            value={world}
            onChange={setWorld}
            options={[
              { id: "stable", label: "Stable season" },
              { id: "growing", label: "Growing waves" },
              { id: "break", label: "One lightning strike" },
            ]}
          />
          <div className="mt-3">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: "obs", label: "Observed" },
                { id: "class", label: "Classical 4-panel" },
                { id: "stl", label: "STL 4-panel" },
              ]}
            />
          </div>
          <div className="mt-4">
            {view === "obs" ? (
              <LinePlot
                series={[
                  { name: "observed", y: raw, color: "var(--color-chart-1)" },
                  { name: "classical trend", y: klass.trend, color: "var(--color-destructive)", dashed: true },
                  { name: "STL trend", y: stl.trend, color: "var(--color-chart-3)" },
                ]}
              />
            ) : view === "class" ? (
              <DecompGrid observed={raw} trend={klass.trend} seasonal={klass.seasonal} resid={klass.resid} />
            ) : (
              <DecompGrid observed={raw} trend={stl.trend} seasonal={stl.seasonal} resid={stl.resid} />
            )}
          </div>
        </Panel>

        <Panel title="How they differ">
          <Table
            headers={["", "Classical", "STL"]}
            rows={[
              ["Trend", "Moving average, fixed width", "LOESS — can bend"],
              ["Season", "Forced almost constant", "Allowed to evolve slowly"],
              ["Flavour", "You pick add / multi", "Additive; log for multi"],
              ["Outliers", "Distort T and S", "Robust weights isolate them"],
              ["Forecast?", "Not the goal", "Not the goal either"],
            ]}
          />
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="Period m" value={period} min={4} max={24} step={1} onChange={setPeriod} />
            <Knob label="Seasonal span" value={seasSpan} min={0.15} max={0.9} step={0.05} onChange={setSeasSpan} hint="Small = season may evolve. Large = almost classical." />
            <Knob label="Trend span" value={trendSpan} min={0.2} max={0.9} step={0.05} onChange={setTrendSpan} hint="Small = wiggly trend. Large = stiff." />
            <Knob label="Slope (growing world)" value={slope} min={0} max={0.4} step={0.01} onChange={setSlope} />
            <Knob label="Season amp" value={amp} min={0} max={16} step={0.5} onChange={setAmp} />
            <Knob label="Outlier size" value={outlier} min={0} max={40} step={1} onChange={setOutlier} hint="Only used in the lightning-strike world." />
            <Knob label="n" value={n} min={96} max={240} step={12} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Robust weights
              <input type="checkbox" checked={robust} onChange={(e) => setRobust(e.target.checked)} />
            </label>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Classical leak" value={leakC.toFixed(2)} />
          <Stat label="STL leak" value={leakS.toFixed(2)} />
        </div>
        {world === "growing" && leakC > leakS + 0.04 ? (
          <Verdict tone="bad" title="Classical additive is the wrong tool here">
            <p>
              Waves grow with the level. Classical additive forces one seasonal height, so leftover structure leaks
              (score {leakC.toFixed(2)} vs STL {leakS.toFixed(2)}). Take logs, or use multiplicative classical, or let
              STL’s seasonal smoother evolve.
            </p>
          </Verdict>
        ) : world === "break" && !robust ? (
          <Verdict tone="warn" title="The strike is being swallowed">
            <p>
              A jump is an intervention, not noise. Without robust weights the trend kinks to eat it. Turn robust on
              and the spike should sit in the residual.
            </p>
          </Verdict>
        ) : world === "stable" && leakC < 0.08 ? (
          <Verdict tone="good" title="Classical is enough">
            <p>
              Season looks stable and additive. STL is not mandatory. If you only need a quick picture, seasonal
              decompose is fine. If you need a forecast, do not stop at either method.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="info" title="Default ladder, not a religion">
            <p>1. Plot. Waves grow → log or multiplicative.</p>
            <p>2. Stable season, quick picture → classical.</p>
            <p>3. Changing season, outliers, bent trend → STL robust.</p>
            <p>4. Need next July → Holt–Winters or SARIMA.</p>
          </Verdict>
        )}
        <Callout>
          Two calendars at once (hour-of-day and day-of-week) want MSTL, TBATS, or two sets of Fourier terms. One STL
          call still has one period.
        </Callout>
      </div>
    </div>
  );
}
