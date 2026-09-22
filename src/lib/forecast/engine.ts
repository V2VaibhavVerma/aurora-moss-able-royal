import {
  actualsFor,
  forecastMonths,
  nationalFrame,
  siteFrame,
  walkMonths,
} from "./data";
import { additiveDecompose } from "./decompose";
import {
  applyClip,
  arimaForecast,
  crostonForecast,
  ensembleLevel,
  ewmaForecast,
  holidayMap,
  holtWintersAuto,
  holtWintersForecast,
  linearRecursive,
  meanForecast,
  persistForecast,
  sarimaForecast,
  sesForecast,
  snaiveForecast,
} from "./models";
import { bias, mae, rmse, volWmae } from "./math";
import type { LabParams, ModelForecast, Point, Score, SiteMethod } from "./types";
import { SITES } from "./types";

function scoreOf(a: number[], p: number[]): Score {
  return {
    mae: mae(a, p),
    rmse: rmse(a, p),
    bias: bias(a, p),
    volWmae: volWmae(a, p),
  };
}

function hwOpts(p: LabParams) {
  return {
    trend: p.hwTrend,
    seasonal: p.hwSeasonal,
    damped: p.hwDamped,
    phi: p.hwPhi,
    m: p.seasonalPeriod,
    alpha: p.hwAlpha,
    beta: p.hwBeta,
    gamma: p.hwGamma,
  };
}

function takeEval(fullWalk: number[], skip: number): number[] {
  return fullWalk.slice(skip);
}

function runUnivariate(
  y: number[],
  series: Point[],
  walk: string[],
  evalMonths: string[],
  p: LabParams,
): Record<string, number[]> {
  const H = walk.length;
  const hw = p.hwAuto
    ? holtWintersAuto(y, H, hwOpts(p))
    : holtWintersForecast(y, H, hwOpts(p));
  return {
    persist: persistForecast(y, H),
    mean: meanForecast(y, H, p.meanWindow),
    mean3: meanForecast(y, H, 3),
    mean6: meanForecast(y, H, 6),
    mean12: meanForecast(y, H, 12),
    snaive: snaiveForecast(series, walk, p.seasonalPeriod),
    ewma: ewmaForecast(y, H, p.ewmaSpan),
    ses: sesForecast(y, H, p.sesAlpha),
    croston: crostonForecast(y, H, p.crostonWindow),
    ensemble: ensembleLevel(y, H, p),
    hw,
    arima: arimaForecast(y, H, p.arimaP, p.arimaD, p.arimaQ),
    sarima: sarimaForecast(
      y,
      H,
      p.arimaP,
      p.arimaD,
      p.arimaQ,
      p.sarimaP,
      p.sarimaD,
      p.sarimaQ,
      p.seasonalPeriod,
    ),
  };
}

function sliceEval(
  bank: Record<string, number[]>,
  skip: number,
  clip: boolean,
): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(bank)) {
    out[k] = applyClip(takeEval(v, skip), clip);
  }
  return out;
}

export type SiteResult = {
  id: string;
  method: string;
  pred: number[];
  actual: number[];
  score: Score;
};

export type EngineResult = {
  origin: string;
  evalMonths: string[];
  walkMonths: string[];
  trainNational: Point[];
  fullNational: Point[];
  actualNat: number[];
  natBank: Record<string, number[]>;
  natLeaderboard: ModelForecast[];
  shippedNat: number[];
  shippedNatId: string;
  shippedNatScore: Score;
  sites: SiteResult[];
  sitePredMatrix: number[][];
  siteActMatrix: number[][];
  siteSum: number[];
  siteSumScore: Score;
  siteMae: number;
  siteVolW: number;
  decomp: ReturnType<typeof additiveDecompose>;
};

const FAMILY: Record<string, string> = {
  persist: "baseline",
  mean: "baseline",
  mean3: "baseline",
  mean6: "baseline",
  mean12: "baseline",
  snaive: "baseline",
  ewma: "smoothing",
  ses: "smoothing",
  croston: "intermittent",
  ensemble: "blend",
  hw: "structural",
  arima: "structural",
  sarima: "structural",
  ols: "regression",
  ridge: "regression",
};

function methodKey(m: SiteMethod, p: LabParams): string {
  if (m === "mean") return p.meanWindow === 12 ? "mean12" : "mean";
  return m;
}

export function runLab(p: LabParams): EngineResult {
  const evalMonths = forecastMonths(p.origin, p.skipMonths, p.horizon);
  const walk = walkMonths(p.origin, p.skipMonths, p.horizon);
  const trainNational = nationalFrame(p.origin, false);
  const fullNational = nationalFrame(undefined, p.dropPaddedTail);
  const y = trainNational.map((x) => x.sales);
  const holNat = holidayMap(fullNational);

  const rawBank = runUnivariate(y, trainNational, walk, evalMonths, p);
  rawBank.ols = linearRecursive(trainNational, walk, holNat, p, 0);
  rawBank.ridge = linearRecursive(trainNational, walk, holNat, p, p.ridgeLambda);
  const natBank = sliceEval(rawBank, p.skipMonths, p.clipNegative);

  // align if missing
  const actualAligned = evalMonths.map((t) => {
    const hit = fullNational.find((x) => x.t === t);
    return hit ? hit.sales : 0;
  });

  const natLeaderboard: ModelForecast[] = Object.entries(natBank)
    .map(([id, pred]) => ({
      id,
      family: FAMILY[id] ?? "other",
      pred,
      score: scoreOf(actualAligned, pred),
    }))
    .sort((a, b) => a.score.mae - b.score.mae);

  const shippedNatId = p.nationalModel === "mean" ? "mean" : p.nationalModel;
  const shippedNat = natBank[shippedNatId] ?? natBank.mean;
  const shippedNatScore = scoreOf(actualAligned, shippedNat);

  const sites: SiteResult[] = [];
  const sitePredMatrix: number[][] = [];
  const siteActMatrix = actualsFor([...SITES], evalMonths);

  for (let i = 0; i < SITES.length; i++) {
    const uid = SITES[i];
    const train = siteFrame(uid, p.origin);
    const yy = train.map((x) => x.sales);
    const hol = holidayMap(
      siteFrame(uid).map((pt) => ({
        ...pt,
        holiday: pt.holiday,
      })),
    );
    const bank = runUnivariate(yy, train, walk, evalMonths, p);
    bank.ols = linearRecursive(train, walk, hol, p, 0);
    bank.ridge = linearRecursive(train, walk, hol, p, p.ridgeLambda);
    const ev = sliceEval(bank, p.skipMonths, p.clipNegative);

    const isMature = p.matureIds.includes(uid);
    const chosen = isMature ? p.matureMethod : p.interMethod;
    let pred = ev[methodKey(chosen, p)] ?? ev.mean;
    if (isMature && p.blendMean12 > 0) {
      const m12 = ev.mean12;
      const b = Math.min(1, Math.max(0, p.blendMean12));
      pred = pred.map((v, k) => (1 - b) * v + b * m12[k]);
    }
    pred = applyClip(pred, p.clipNegative);
    const actual = siteActMatrix[i];
    sites.push({
      id: uid,
      method: chosen,
      pred,
      actual,
      score: scoreOf(actual, pred),
    });
    sitePredMatrix.push(pred);
  }

  const siteSum = evalMonths.map((_, t) =>
    sitePredMatrix.reduce((s, row) => s + row[t], 0),
  );
  const flatA = siteActMatrix.flat();
  const flatP = sitePredMatrix.flat();

  return {
    origin: p.origin,
    evalMonths,
    walkMonths: walk,
    trainNational,
    fullNational,
    actualNat: actualAligned,
    natBank,
    natLeaderboard,
    shippedNat,
    shippedNatId,
    shippedNatScore,
    sites,
    sitePredMatrix,
    siteActMatrix,
    siteSum,
    siteSumScore: scoreOf(actualAligned, siteSum),
    siteMae: mae(flatA, flatP),
    siteVolW: volWmae(flatA, flatP),
    decomp: additiveDecompose(y, p.seasonalPeriod),
  };
}

export function paramInsight(p: LabParams, r: EngineResult): string[] {
  const lines: string[] = [];
  const { origin, evalMonths, shippedNatScore, actualNat } = r;
  lines.push(
    `Origin is ${origin.slice(0, 7)}. Models see nothing after that close. Score window is ${evalMonths.map((t) => t.slice(0, 7)).join(", ")}.`,
  );
  if (p.skipMonths > 0) {
    lines.push(
      `Skip = ${p.skipMonths}: the first ${p.skipMonths} month(s) after origin are a bridge (generated, not scored). That is the notebook protocol when January trains and March–May score.`,
    );
  } else {
    lines.push(
      "Skip = 0: the first forecast month is the next calendar month. Consecutive walk-forward — usually easier for persist / ARIMA.",
    );
  }
  lines.push(
    `National ${p.nationalModel} MAE ${shippedNatScore.mae.toFixed(2)}, RMSE ${shippedNatScore.rmse.toFixed(2)}, bias ${shippedNatScore.bias.toFixed(2)}. Actuals: ${actualNat.map((v) => v.toFixed(0)).join(" / ")}. Forecast: ${r.shippedNat.map((v) => v.toFixed(1)).join(" / ")}.`,
  );
  if (p.nationalModel === "snaive" || p.nationalModel === "hw") {
    lines.push(
      "Seasonal structure assumes 2026 rhymes with last year. On this extract 2025 Mar–May was a peak (45/35/44); 2026 is flatter. That is why Mean-12 usually wins.",
    );
  }
  if (p.nationalModel === "hw" && p.hwTrend && !p.hwDamped) {
    lines.push(
      "Undamped Holt–Winters still believes in 2022–2025 growth. Damping or turning trend off is how you stop it from flying past the stall.",
    );
  }
  if (p.nationalModel === "ols" || p.nationalModel === "ridge") {
    lines.push(
      `Enrollments after origin are unknown, so they freeze at the last ${p.enrollFreezeWindow}-month mean. If that freeze is wrong, extra lags will not save the path — you need a brand plan, not a bigger model.`,
    );
  }
  const worst = [...r.sites].sort((a, b) => b.score.mae - a.score.mae)[0];
  if (worst) {
    lines.push(
      `Largest site MAE is ${worst.id} (${worst.score.mae.toFixed(2)}). One-month shocks (ID10 April, ID4 April, ID7 March) dominate leftover error — more parameters fit 2025 spikes and miss 2026.`,
    );
  }
  lines.push(
    `Shipped sites: mature → ${p.matureMethod}, intermittent → ${p.interMethod}. Site MAE ${r.siteMae.toFixed(2)}, volume-weighted ${r.siteVolW.toFixed(2)}. Sum-of-sites national MAE ${r.siteSumScore.mae.toFixed(2)}.`,
  );
  return lines;
}
