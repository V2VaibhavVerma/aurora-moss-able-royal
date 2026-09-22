import { useMemo, useState } from "react";
import { acf } from "@/lib/ts/acf";
import { simulate, shuffle } from "@/lib/ts/sim";
import { mean } from "@/lib/forecast/math";
import { stdev } from "@/lib/ts/stats";
import { AcfBars, LinePlot } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Verdict } from "./ui";

type Ex = "gdp" | "icecream" | "load" | "price" | "noise";

const EXAMPLES: { id: Ex; label: string; why: string }[] = [
  { id: "gdp", label: "Real GDP", why: "Slow drift. July is not the point — this July vs July five years ago is." },
  { id: "icecream", label: "Ice cream", why: "Calendar season. You can name the period before you model." },
  { id: "load", label: "Grid load", why: "A 24-hour evening peak. Season at a daily clock." },
  { id: "price", label: "Asset price", why: "A stacked shock. The level wanders; the change is closer to noise." },
  { id: "noise", label: "Measurement", why: "Already white. The best forecast of the next shock is 0." },
];

export function ChIntro() {
  const [ex, setEx] = useState<Ex>("icecream");
  const [n, setN] = useState(180);
  const [seed, setSeed] = useState(7);
  const [doShuffle, setDoShuffle] = useState(false);
  const [sigma, setSigma] = useState(1.4);

  const raw = useMemo(() => {
    if (ex === "gdp") return simulate("trend", n, seed, { level: 40, slope: 0.18, sigma });
    if (ex === "icecream") return simulate("multi", n, seed, { level: 30, slope: 0.12, seasonAmp: 6, period: 12, sigma });
    if (ex === "load") return simulate("season", n, seed, { level: 50, slope: 0.02, seasonAmp: 12, period: 24, sigma: sigma * 0.6 });
    if (ex === "price") return simulate("rw", n, seed, { sigma: sigma * 0.8 });
    return simulate("white", n, seed, { sigma });
  }, [ex, n, seed, sigma]);

  const y = useMemo(() => (doShuffle ? shuffle(raw, seed + 3) : raw), [doShuffle, raw, seed]);
  const r = useMemo(() => acf(y, 24), [y]);
  const rRaw = useMemo(() => acf(raw, 24), [raw]);

  const lag1 = r[1] ?? 0;
  const lag1raw = rRaw[1] ?? 0;

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">1 · Object</p>
          <h2 className="mt-1 font-display text-3xl">A series is a number with a clock.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Time series analysis is what you do when the order is the information. Shuffle the rows and you no
            longer have a series — you have a cross-section that forgot its past. The four jobs: describe the pieces,
            forecast a future the model was not allowed to see, monitor a break, explain a channel.
          </p>
          <Formula>
            y<sub>t</sub> is observed at date t. The cut is a date, never a random split.
          </Formula>
        </Panel>

        <Panel title="Pick a real shape, then break the clock">
          <Segmented value={ex} onChange={setEx} options={EXAMPLES.map((e) => ({ id: e.id, label: e.label }))} />
          <p className="mt-3 text-sm text-muted-foreground">{EXAMPLES.find((e) => e.id === ex)?.why}</p>
          <div className="mt-4">
            <LinePlot
              series={[
                { name: doShuffle ? "shuffled" : "in time", y, color: "var(--color-chart-1)" },
                ...(doShuffle ? [{ name: "true order", y: raw, color: "var(--color-chart-3)", dashed: true }] : []),
              ]}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AcfBars values={r} n={y.length} title={doShuffle ? "ACF of the shuffled series" : "ACF in time"} />
            {doShuffle ? <AcfBars values={rRaw} n={raw.length} title="ACF of the true order" /> : (
              <Callout>
                Key characteristics: ordered timestamps, possible unequal spacing, autocorrelation, a level that can
                drift, a season you can name from a calendar. Goals: description, forecast, control, monitoring. None
                of those survive a shuffled split.
              </Callout>
            )}
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="Length n" value={n} min={60} max={360} step={12} onChange={setN} hint="Short series make every test shy." />
            <Knob label="Noise σ" value={sigma} min={0.2} max={4} step={0.1} onChange={setSigma} />
            <Knob label="Seed" value={seed} min={1} max={40} step={1} onChange={setSeed} hint="A new draw of the same process." />
            <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 text-sm">
              Shuffle time
              <input type="checkbox" checked={doShuffle} onChange={(e) => setDoShuffle(e.target.checked)} />
            </label>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Mean" value={mean(y).toFixed(2)} />
          <Stat label="Std" value={stdev(y).toFixed(2)} />
          <Stat label="ρ₁ now" value={lag1.toFixed(2)} />
          <Stat label="ρ₁ true" value={lag1raw.toFixed(2)} />
        </div>
        {doShuffle ? (
          <Verdict tone="bad" title="You destroyed the object">
            <p>
              Lag-1 correlation fell from {lag1raw.toFixed(2)} to {lag1.toFixed(2)}. Random cross-validation leaks the
              future into the past and then pretends the leftover is a test. For a series the cut is a date.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="good" title="Keep the order">
            <p>
              Train on the earlier part, test on the later part. If you remember only one rule from this workshop:
              never shuffle time.
            </p>
          </Verdict>
        )}
      </div>
    </div>
  );
}
