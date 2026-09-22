import { acf, band, pacf } from "./acf";

function lastSignificant(vals: number[], b: number, from = 1): number {
  let last = 0;
  for (let k = from; k < vals.length; k++) {
    if (Math.abs(vals[k]) > b) last = k;
  }
  return last;
}

function firstCutoff(vals: number[], b: number, from = 1): number {
  for (let k = from; k < vals.length; k++) {
    if (Math.abs(vals[k]) > b) continue;
    let quiet = true;
    for (let j = k; j < Math.min(vals.length, k + 3); j++) {
      if (Math.abs(vals[j]) > b) quiet = false;
    }
    if (quiet) return k - 1;
  }
  return lastSignificant(vals, b, from);
}

function tailsOff(vals: number[], b: number): boolean {
  const cut = firstCutoff(vals, b);
  const last = lastSignificant(vals, b);
  return last - cut >= 3 || (cut >= 4 && last >= 6);
}

export type IdHint = {
  acfCut: number;
  pacfCut: number;
  slowDecay: boolean;
  seasonalLag: number | null;
  suggest: string;
  why: string;
  suitable: boolean;
  dHint: 0 | 1 | 2;
};

export function identify(y: number[], maxLag = 24, period = 12): IdHint {
  const r = acf(y, maxLag);
  const p = pacf(y, Math.min(maxLag, 18));
  const b = band(y.length);
  const acfCut = firstCutoff(r, b);
  const pacfCut = firstCutoff(p, b);
  const slowDecay = r.slice(1, 8).every((v) => v > 0.35);
  let seasonalLag: number | null = null;
  if (period > 1 && r.length > period) {
    if (Math.abs(r[period] ?? 0) > b * 1.1) seasonalLag = period;
  }
  let suggest = "white noise";
  let why = "ACF and PACF are quiet after lag 0. Forecast the mean and stop.";
  let suitable = true;
  let dHint: 0 | 1 | 2 = 0;

  if (slowDecay) {
    suggest = "difference first — do not read p, q yet";
    why =
      "ACF slides down from 1. That is a wandering level, not an AR(20). Take Δy, then read the plots again. This is d = 1.";
    suitable = false;
    dHint = 1;
  } else if (acfCut <= 0 && pacfCut <= 0) {
    suggest = "white noise · ARIMA(0,0,0)";
    why = "No leftover linear memory. A fancy model will just fit noise.";
  } else if (pacfCut >= 1 && pacfCut <= 3 && (acfCut > pacfCut || tailsOff(r, b))) {
    suggest = `AR(${pacfCut})`;
    why = `PACF cuts off after lag ${pacfCut}; ACF tails off. Once the last ${pacfCut} values are in the model, further lags add nothing.`;
  } else if (acfCut >= 1 && acfCut <= 3 && (pacfCut > acfCut || tailsOff(p, b))) {
    suggest = `MA(${acfCut})`;
    why = `ACF cuts off after lag ${acfCut}; PACF tails off. A shock spills ${acfCut} period${acfCut > 1 ? "s" : ""} and then dies.`;
  } else {
    suggest = "ARMA(p, q) — search small mixed orders";
    why =
      "Both plots tail off. There is no cliff. Fit a few small (p, q), keep the one with white-noise residuals and the smallest AIC.";
  }

  if (seasonalLag && !slowDecay) {
    suggest += ` · seasonal lag ${seasonalLag}`;
    why += ` Extra spike at lag ${seasonalLag} is the calendar. That is m, not a reason to fit AR(${seasonalLag}).`;
  }

  return { acfCut, pacfCut, slowDecay, seasonalLag, suggest, why, suitable, dHint };
}

export function residualVerdict(resid: number[]): { ok: boolean; text: string } {
  const hint = identify(resid, 16, 12);
  if (hint.slowDecay) {
    return { ok: false, text: "Residuals still wander. You under-differenced, or a trend remains." };
  }
  if (hint.suggest.startsWith("white")) {
    return { ok: true, text: "Residual ACF is dead. The univariate structure is finished." };
  }
  return {
    ok: false,
    text: `Residuals still look like ${hint.suggest}. The order is wrong, or a season / break remains.`,
  };
}
