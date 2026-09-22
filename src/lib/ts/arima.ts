import { mean, ridgeFit } from "@/lib/forecast/math";
import { acf } from "./acf";
import { aicFromResid } from "./metrics";
import { difference, seasonalDiff } from "./stats";

export function yuleWalker(y: number[], p: number): number[] {
  if (p <= 0) return [];
  const r = acf(y, p);
  const R: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const rhs = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    rhs[i] = r[i + 1];
    for (let j = 0; j < p; j++) R[i][j] = r[Math.abs(i - j)];
  }
  return ridgeFit(R, rhs, 1e-6) ?? Array(p).fill(0);
}

function longARResid(y: number[], pLong: number): number[] {
  const phi = yuleWalker(y, pLong);
  const m = mean(y);
  const e = Array(y.length).fill(0);
  for (let t = 0; t < y.length; t++) {
    let yh = m;
    for (let i = 1; i <= pLong; i++) {
      yh += (phi[i - 1] ?? 0) * ((y[t - i] ?? m) - m);
    }
    e[t] = y[t] - yh;
  }
  return e;
}

export type ArmaFit = {
  phi: number[];
  theta: number[];
  Phi: number[];
  Theta: number[];
  c: number;
  resid: number[];
  fitted: number[];
  aic: number;
  bic: number;
  aicc: number;
  k: number;
};

export type ArimaFit = ArmaFit & { d: number; D: number; m: number; origFitted: number[] };

function at(arr: number[], t: number, fill = 0): number {
  return t >= 0 && t < arr.length ? arr[t] : fill;
}

export function fitARMA(y: number[], p: number, q: number, P = 0, Q = 0, m = 12): ArmaFit {
  const n = y.length;
  const pLong = Math.min(Math.max(p + q + (P + Q) * Math.max(1, m) + 4, 6), Math.floor(n / 4) || 1);
  let e = longARResid(y, Math.max(1, pLong));
  const rows: number[][] = [];
  const yy: number[] = [];
  const start = Math.max(p, q, P * m, Q * m, pLong, 1);
  for (let t = start; t < n; t++) {
    const row = [1];
    for (let i = 1; i <= p; i++) row.push(at(y, t - i));
    for (let i = 1; i <= P; i++) row.push(at(y, t - i * m));
    for (let j = 1; j <= q; j++) row.push(at(e, t - j));
    for (let j = 1; j <= Q; j++) row.push(at(e, t - j * m));
    rows.push(row);
    yy.push(y[t]);
  }
  const k = 1 + p + P + q + Q;
  const b = ridgeFit(rows, yy, 0.0004) ?? [mean(y), ...Array(Math.max(0, k - 1)).fill(0)];
  const c = b[0] ?? 0;
  let off = 1;
  const phi = b.slice(off, off + p);
  off += p;
  const Phi = b.slice(off, off + P);
  off += P;
  const theta = b.slice(off, off + q);
  off += q;
  const Theta = b.slice(off, off + Q);
  const fitted: number[] = [];
  const resid: number[] = [];
  for (let t = 0; t < n; t++) {
    let yh = c;
    for (let i = 1; i <= p; i++) yh += (phi[i - 1] ?? 0) * at(y, t - i, c);
    for (let i = 1; i <= P; i++) yh += (Phi[i - 1] ?? 0) * at(y, t - i * m, c);
    for (let j = 1; j <= q; j++) yh += (theta[j - 1] ?? 0) * at(resid, t - j);
    for (let j = 1; j <= Q; j++) yh += (Theta[j - 1] ?? 0) * at(resid, t - j * m);
    fitted.push(yh);
    resid.push(y[t] - yh);
  }
  const info = aicFromResid(resid.slice(Math.max(start, 1)), Math.max(1, k));
  return { phi, theta, Phi, Theta, c, resid, fitted, aic: info.aic, bic: info.bic, aicc: info.aicc, k };
}

function undifference(last: number[], dY: number[]): number[] {
  const out: number[] = [];
  let prev = last[last.length - 1] ?? 0;
  if (last.length === 2) {
    let a = last[0];
    let b = last[1];
    for (const z of dY) {
      const nxt = 2 * b - a + z;
      out.push(nxt);
      a = b;
      b = nxt;
    }
    return out;
  }
  for (const z of dY) {
    prev = prev + z;
    out.push(prev);
  }
  return out;
}

function undifferenceSeasonal(history: number[], m: number, diffs: number[]): number[] {
  const h = history.slice();
  const out: number[] = [];
  for (const z of diffs) {
    const nxt = (h[h.length - m] ?? h[h.length - 1] ?? 0) + z;
    h.push(nxt);
    out.push(nxt);
  }
  return out;
}

function oneStepBack(
  y: number[],
  d: number,
  D: number,
  m: number,
  zFitted: number[],
): number[] {
  const n = y.length;
  const orig = y.slice();
  const start = d + D * Math.max(1, m);
  if (D <= 0 && d <= 0) {
    for (let t = 0; t < Math.min(n, zFitted.length); t++) orig[t] = zFitted[t];
    return orig;
  }
  if (D <= 0 && d === 1) {
    orig[0] = y[0];
    for (let t = 1; t < n; t++) orig[t] = y[t - 1] + (zFitted[t - 1] ?? 0);
    return orig;
  }
  if (D <= 0 && d >= 2) {
    orig[0] = y[0];
    orig[1] = y[1] ?? y[0];
    for (let t = 2; t < n; t++) orig[t] = 2 * y[t - 1] - y[t - 2] + (zFitted[t - 2] ?? 0);
    return orig;
  }
  // Seasonal (and maybe regular) one-step using actual lags of y.
  for (let t = 0; t < n; t++) {
    if (t < start) {
      orig[t] = y[t];
      continue;
    }
    const zHat = zFitted[t - start] ?? 0;
    if (d === 0) {
      orig[t] = y[t - m] + zHat;
    } else if (d === 1) {
      // Δ_m Δ y_t ≈ z_t  ⇒  y_t ≈ y_{t-1} + y_{t-m} - y_{t-m-1} + z_t
      orig[t] = y[t - 1] + y[t - m] - (y[t - m - 1] ?? y[t - m]) + zHat;
    } else {
      orig[t] = y[t - 1] + y[t - m] - (y[t - m - 1] ?? y[t - m]) + zHat;
    }
  }
  return orig;
}

export function fitARIMA(y: number[], p: number, d: number, q: number): ArimaFit {
  return fitSARIMA(y, p, d, q, 0, 0, 0, 12);
}

export function fitSARIMA(
  y: number[],
  p: number,
  d: number,
  q: number,
  P: number,
  D: number,
  Q: number,
  m: number,
): ArimaFit {
  let z = y.slice();
  if (D > 0 && m > 1) z = seasonalDiff(z, m);
  z = difference(z, d);
  const fit = fitARMA(z, p, q, P, Q, m);
  const origFitted = oneStepBack(y, d, D, m, fit.fitted);
  return { ...fit, d, D, m, origFitted };
}

function forecastDifferenced(
  z: number[],
  fit: ArmaFit,
  p: number,
  q: number,
  P: number,
  Q: number,
  m: number,
  h: number,
): number[] {
  const zHist = z.slice();
  const eHist = fit.resid.slice();
  const zFc: number[] = [];
  for (let k = 0; k < h; k++) {
    let yh = fit.c;
    for (let i = 1; i <= p; i++) yh += (fit.phi[i - 1] ?? 0) * at(zHist, zHist.length - i);
    for (let i = 1; i <= P; i++) yh += (fit.Phi[i - 1] ?? 0) * at(zHist, zHist.length - i * m);
    for (let j = 1; j <= q; j++) yh += (fit.theta[j - 1] ?? 0) * at(eHist, eHist.length - j);
    for (let j = 1; j <= Q; j++) yh += (fit.Theta[j - 1] ?? 0) * at(eHist, eHist.length - j * m);
    zFc.push(yh);
    zHist.push(yh);
    eHist.push(0);
  }
  return zFc;
}

export function forecastARIMA(
  y: number[],
  p: number,
  d: number,
  q: number,
  h: number,
): { fit: ArimaFit; fc: number[] } {
  return forecastSARIMA(y, p, d, q, 0, 0, 0, 12, h);
}

export function forecastSARIMA(
  y: number[],
  p: number,
  d: number,
  q: number,
  P: number,
  D: number,
  Q: number,
  m: number,
  h: number,
): { fit: ArimaFit; fc: number[] } {
  const fit = fitSARIMA(y, p, d, q, P, D, Q, m);
  let z = y.slice();
  if (D > 0 && m > 1) z = seasonalDiff(z, m);
  const afterSeason = z.slice();
  z = difference(z, d);
  const zFc = forecastDifferenced(z, fit, p, q, P, Q, m, h);

  let mid: number[];
  if (d === 0) mid = zFc;
  else if (d === 1) mid = undifference([afterSeason[afterSeason.length - 1] ?? 0], zFc);
  else
    mid = undifference(
      [afterSeason[afterSeason.length - 2] ?? 0, afterSeason[afterSeason.length - 1] ?? 0],
      zFc,
    );

  const fc = D > 0 && m > 1 ? undifferenceSeasonal(y, m, mid) : mid;
  return { fit, fc };
}

export function gridARIMA(y: number[], d: number, pMax = 2, qMax = 2) {
  const rows: { p: number; d: number; q: number; aic: number; bic: number }[] = [];
  for (let p = 0; p <= pMax; p++) {
    for (let q = 0; q <= qMax; q++) {
      const f = fitARIMA(y, p, d, q);
      rows.push({ p, d, q, aic: f.aic, bic: f.bic });
    }
  }
  rows.sort((a, b) => a.aic - b.aic);
  return rows;
}

export function invertMA1(theta: number): boolean {
  return Math.abs(theta) < 1;
}

export function stationaryAR1(phi: number): boolean {
  return Math.abs(phi) < 1;
}
