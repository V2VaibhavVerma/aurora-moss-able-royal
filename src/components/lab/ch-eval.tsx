import { useMemo, useState } from "react";
import { holt, holtWinters, sesForecast } from "@/lib/ts/smooth";
import { forecastARIMA, gridARIMA } from "@/lib/ts/arima";
import { mae, mape, mase, mse, rmse, smape } from "@/lib/ts/metrics";
import { injectOutlier, shuffle, simulate, withMissing } from "@/lib/ts/sim";
import { forwardFill, linearFill, seasonalFill } from "@/lib/ts/fill";
import { mean } from "@/lib/forecast/math";
import { LinePlot, MiniBars } from "./charts";
import { Callout, Formula, Knob, Panel, Segmented, Stat, Table, Verdict } from "./ui";

function metrics(a: number[], p: number[], season: number) {
  return {
    mae: mae(a, p),
    mse: mse(a, p),
    rmse: rmse(a, p),
    mape: mape(a, p),
    smape: smape(a, p),
    mase: mase(a, p, season),
  };
}

export function ChEval() {
  const [tab, setTab] = useState<"score" | "aic" | "prep">("score");
  const [n, setN] = useState(144);
  const [seed, setSeed] = useState(3);
  const [cut, setCut] = useState(120);
  const [spike, setSpike] = useState(0);
  const [shuffleSplit, setShuffleSplit] = useState(false);
  const [level, setLevel] = useState(40);
  const [miss, setMiss] = useState(0.08);
  const [block, setBlock] = useState(false);
  const [fill, setFill] = useState<"ffill" | "linear" | "season">("linear");
  const [overfitP, setOverfitP] = useState(3);

  const raw = useMemo(
    () => simulate("season", n, seed, { level, slope: 0.1, seasonAmp: 8, period: 12, sigma: 1.4 }),
    [n, seed, level],
  );
  const spiked = useMemo(() => {
    if (!spike) return raw;
    return injectOutlier(raw, Math.min(raw.length - 5, cut + 6), spike);
  }, [raw, spike, cut]);

  const origin = Math.min(spiked.length - 4, Math.max(24, cut));
  const train = spiked.slice(0, origin);
  const test = spiked.slice(origin);
  const shuffled = useMemo(() => shuffle(spiked, seed + 9), [spiked, seed]);
  const cheatTrain = shuffled.slice(0, origin);
  const cheatTest = shuffled.slice(origin);

  const models = useMemo(() => {
    const h = test.length;
    const naive = Array(h).fill(train[train.length - 1]);
    const mu = mean(train);
    const meanFc = Array(h).fill(mu);
    const ses = sesForecast(train, 0.3, h).forecast;
    const ho = holt(train, 0.3, 0.15, h).forecast;
    const hw = holtWinters(train, 12, 0.3, 0.15, 0.2, h, false).forecast;
    const ar = forecastARIMA(train, 1, 1, 1, h).fc;
    const names = ["Naive", "Mean", "SES", "Holt", "HW", "ARIMA(1,1,1)"];
    const fcs = [naive, meanFc, ses, ho, hw, ar];
    const scored = names.map((name, i) => ({ name, fc: fcs[i], ...metrics(test, fcs[i], 12) }));
    return scored;
  }, [train, test]);

  const cheat = useMemo(() => {
    const h = cheatTest.length;
    const hw = holtWinters(cheatTrain, 12, 0.3, 0.15, 0.2, h, false).forecast;
    return metrics(cheatTest, hw, 12);
  }, [cheatTrain, cheatTest]);

  const honestHW = models.find((m) => m.name === "HW")!;
  const rankingMae = [...models].sort((a, b) => a.mae - b.mae);
  const rankingRmse = [...models].sort((a, b) => a.rmse - b.rmse);

  const grid = useMemo(() => gridARIMA(train, 1, overfitP, 2), [train, overfitP]);

  const missing = useMemo(() => withMissing(raw, miss, seed, block), [raw, miss, seed, block]);
  const filled = useMemo(() => {
    if (fill === "ffill") return forwardFill(missing);
    if (fill === "season") return seasonalFill(missing, 12);
    return linearFill(missing);
  }, [missing, fill]);

  const shownTest = Array(origin)
    .fill(null)
    .concat(test);
  const shownHw = Array(origin)
    .fill(null)
    .concat(honestHW.fc);

  const mapeBroken = honestHW.mape == null;
  const rmseGap = honestHW.rmse / Math.max(1e-6, honestHW.mae);

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">10 · Evaluation</p>
          <h2 className="mt-1 font-display text-3xl">Score a future it was not allowed to see.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            MAE, MSE, RMSE, MAPE score predictions against a hold-out. AIC and BIC score how well a model describes
            the sample it was estimated on, with a tax on extra parameters. They are not a substitute for a hold-out.
            Never shuffle time. The cut is a date.
          </p>
          <Formula>e<sub>t</sub> = y<sub>t</sub> − ŷ<sub>t</sub></Formula>
        </Panel>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "score", label: "Hold-out metrics" },
            { id: "aic", label: "AIC / BIC" },
            { id: "prep", label: "Holes & spikes" },
          ]}
        />

        {tab === "score" ? (
          <>
            <Panel title="One series, several scores">
              <LinePlot
                series={[
                  { name: "actual", y: spiked, color: "var(--color-chart-1)" },
                  { name: "Holt–Winters", y: shownHw, color: "var(--color-chart-4)", dashed: true },
                  { name: "hold-out actual", y: shownTest, color: "var(--color-chart-3)" },
                ]}
                splitAt={origin - 1}
              />
              <div className="mt-4">
                <MiniBars
                  labels={models.map((m) => m.name)}
                  values={models.map((m) => m.mae)}
                  highlight={models.findIndex((m) => m.name === rankingMae[0].name)}
                />
              </div>
            </Panel>
            <Panel title="The ranking can change with the metric">
              <Table
                headers={["Model", "MAE", "RMSE", "MAPE", "MASE"]}
                rows={models.map((m) => [
                  m.name,
                  m.mae.toFixed(2),
                  m.rmse.toFixed(2),
                  m.mape == null ? "undefined" : m.mape.toFixed(1) + "%",
                  m.mase.toFixed(2),
                ])}
                highlight={models.findIndex((m) => m.name === rankingMae[0].name)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                MAE winner {rankingMae[0].name} · RMSE winner {rankingRmse[0].name}
                {rankingMae[0].name !== rankingRmse[0].name ? " — they disagree." : "."} Rule of thumb: RMSE ≈ 1.25 ×
                MAE when errors are not wild. Here RMSE/MAE = {rmseGap.toFixed(2)}.
              </p>
            </Panel>
          </>
        ) : null}

        {tab === "aic" ? (
          <Panel title="In-sample error always falls. AIC tells you when to stop.">
            <Table
              headers={["(p,1,q)", "AIC", "BIC"]}
              rows={grid.map((g) => [`(${g.p},1,${g.q})`, g.aic.toFixed(1), g.bic.toFixed(1)])}
              highlight={0}
            />
            <Callout>
              AIC = −2 log L̂ + 2k. BIC replaces 2k with k log n, so in large samples it prefers simpler models. Neither
              is the truth. You cannot compare a model on levels with a model on logs. A model can win AIC and lose
              next year.
            </Callout>
          </Panel>
        ) : null}

        {tab === "prep" ? (
          <Panel title="Dropping a row changes every lag">
            <LinePlot
              series={[
                { name: "filled (pretend actuals)", y: filled, color: "var(--color-chart-5)", dashed: true },
                { name: "true series", y: raw, color: "var(--color-chart-1)" },
              ]}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Scattered holes can be interpolated if short relative to the season. A block hole invents a fake week if
              you linearly fill it. Never fill first and then congratulate the model for “predicting” the filled
              values. Imputed points are not actuals.
            </p>
          </Panel>
        ) : null}
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Parameters">
          <div className="space-y-4">
            <Knob label="The cut (origin)" value={cut} min={36} max={n - 6} step={1} onChange={setCut} hint="Train earlier, test later." />
            <Knob label="Hold-out spike" value={spike} min={0} max={40} step={1} onChange={setSpike} hint="MSE/RMSE treat one disaster as a crisis. MAE treats it as one large miss. MAPE depends on the level of y_t." />
            <Knob label="Level of y" value={level} min={5} max={80} step={1} onChange={setLevel} hint="MAPE explodes when actuals are near 0." />
            <Knob label="Missing fraction" value={miss} min={0} max={0.35} step={0.01} onChange={setMiss} />
            <Knob label="AIC p max" value={overfitP} min={1} max={4} step={1} onChange={setOverfitP} />
            <Knob label="n" value={n} min={72} max={240} step={12} onChange={setN} />
            <Knob label="Seed" value={seed} min={1} max={30} step={1} onChange={setSeed} />
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Shuffle the split
              <input type="checkbox" checked={shuffleSplit} onChange={(e) => setShuffleSplit(e.target.checked)} />
            </label>
            <label className="flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm">
              Block holes
              <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} />
            </label>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Fill method</p>
              <Segmented
                value={fill}
                onChange={setFill}
                options={[
                  { id: "ffill", label: "Forward" },
                  { id: "linear", label: "Linear" },
                  { id: "season", label: "Seasonal" },
                ]}
              />
            </div>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Honest HW MAE" value={honestHW.mae.toFixed(2)} />
          <Stat label="Shuffled HW MAE" value={cheat.mae.toFixed(2)} />
        </div>
        {shuffleSplit ? (
          <Verdict tone="bad" title="You leaked the future">
            <p>
              Random split MAE {cheat.mae.toFixed(2)} vs honest time-cut {honestHW.mae.toFixed(2)}. The shuffled number
              is not a forecast score. It is a description of a series that no longer exists.
            </p>
          </Verdict>
        ) : spike > 12 ? (
          <Verdict tone="warn" title="One miss is dominating RMSE">
            <p>
              MAE is the typical miss, in the units of the series. RMSE is pulled up by the tail. If RMSE is much
              larger than MAE, look at those periods before you redesign the model. MAPE is{" "}
              {mapeBroken ? "undefined (actual near 0)" : "asymmetric and explodes at zero"}. Prefer MAE+RMSE always;
              add MAPE only if every actual is safely away from zero.
            </p>
          </Verdict>
        ) : tab === "prep" && block && fill === "linear" ? (
          <Verdict tone="bad" title="Linear fill across a block invents a week">
            <p>
              Keep the timestamp, store a hole. Forward fill is deadly if you fill a week of demand with Friday.
              Seasonal fill (this Tuesday from nearby Tuesdays) is the honest interpolation when the week is the unit.
            </p>
          </Verdict>
        ) : (
          <Verdict tone="good" title="Time-respecting hold-out">
            <p>
              Report MAE and RMSE always. Look at a plot of e<sub>t</sub> — a metric will not show you that all the
              error sits in June. AIC is for comparing orders in the modelling room, on the same series, same
              transform, same sample.
            </p>
          </Verdict>
        )}
      </div>
    </div>
  );
}
