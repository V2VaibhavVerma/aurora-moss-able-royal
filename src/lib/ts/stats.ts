import { mean, ridgeFit } from "@/lib/forecast/math";
import { acf } from "./acf";

function olsSimple(y: number[], includeTrend: boolean) {
  const n = y.length;
  const X: number[][] = [];
  const yy: number[] = [];
  for (let t = 1; t < n; t++) {
    const row = [1, y[t - 1]];
    if (includeTrend) row.push(t);
    X.push(row);
    yy.push(y[t] - y[t - 1]);
  }
  const b = ridgeFit(X, yy, 0.0001);
  if (!b) return { tstat: 0, gamma: 0 };
  let sse = 0;
  for (let i = 0; i < X.length; i++) {
    const yh = b.reduce((s, bj, j) => s + bj * X[i][j], 0);
    sse += (yy[i] - yh) ** 2;
  }
  const k = b.length;
  const s2 = sse / Math.max(1, X.length - k);
  const XtX: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  for (const row of X) {
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) XtX[i][j] += row[i] * row[j];
  }
  const e = Array(k).fill(0);
  e[1] = 1;
  const invCol = solveLocal(XtX, e);
  const se = invCol ? Math.sqrt(Math.max(1e-12, s2 * invCol[1])) : 1;
  return { tstat: b[1] / se, gamma: b[1] };
}

function solveLocal(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
    if (Math.abs(M[piv][i]) < 1e-12) return null;
    [M[i], M[piv]] = [M[piv], M[i]];
    const d = M[i][i];
    for (let c = i; c <= n; c++) M[i][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  return M.map((row) => row[n]);
}

export function adf(y: number[], trend = false) {
  const { tstat } = olsSimple(y, trend);
  const crit = trend ? -3.41 : -2.86;
  return {
    tstat,
    crit,
    rejectUnitRoot: tstat < crit,
    label: trend ? "ADF (const + trend)" : "ADF (const)",
  };
}

export function kpss(y: number[], trend = false) {
  const n = y.length;
  const t = Array.from({ length: n }, (_, i) => i);
  let e: number[];
  if (trend) {
    const X = t.map((ti) => [1, ti]);
    const b = ridgeFit(X, y, 0) ?? [mean(y), 0];
    e = y.map((v, i) => v - (b[0] + b[1] * i));
  } else {
    const m = mean(y);
    e = y.map((v) => v - m);
  }
  let s = 0;
  let ss = 0;
  for (const v of e) {
    s += v;
    ss += s * s;
  }
  const sigma = e.reduce((a, v) => a + v * v, 0) / n || 1e-12;
  const eta = ss / (n * n * sigma);
  const crit = trend ? 0.146 : 0.463;
  return {
    eta,
    crit,
    rejectStationary: eta > crit,
    label: trend ? "KPSS (trend)" : "KPSS (level)",
  };
}

export function stationarityCall(y: number[]) {
  const a = adf(y, false);
  const k = kpss(y, false);
  const at = adf(y, true);
  const kt = kpss(y, true);
  let call = "ambiguous";
  let why =
    "ADF failed to reject a unit root and KPSS failed to reject stationarity. The sample is under-powered. Look at the plot.";
  if (a.rejectUnitRoot && !k.rejectStationary) {
    call = "stationary";
    why = "ADF rejects a unit root and KPSS does not reject stationarity. Comfortably weakly stationary.";
  }
  if (!a.rejectUnitRoot && k.rejectStationary) {
    call = "unit root";
    why = "ADF cannot reject a unit root and KPSS rejects stationarity. Treat as I(1) and difference.";
  }
  if (!a.rejectUnitRoot && !k.rejectStationary) {
    call = "ambiguous";
    why =
      "Both tests are shy. Fail-to-reject is not proof. Look at the rolling mean, or get more data, or difference once and see if the ACF dies.";
  }
  if (a.rejectUnitRoot && k.rejectStationary) {
    call = "maybe trend / break";
    why =
      "Tests disagree in the other direction. Something else is wrong: a break, changing variance, leftover season, or you used the wrong deterministic terms.";
  }
  return { adf: a, kpss: k, adfTrend: at, kpssTrend: kt, call, why };
}

export function difference(y: number[], d: number): number[] {
  let cur = y.slice();
  for (let k = 0; k < d; k++) {
    const n: number[] = [];
    for (let i = 1; i < cur.length; i++) n.push(cur[i] - cur[i - 1]);
    cur = n;
  }
  return cur;
}

export function seasonalDiff(y: number[], s: number): number[] {
  const o: number[] = [];
  for (let i = s; i < y.length; i++) o.push(y[i] - y[i - s]);
  return o;
}

export function boxCox(y: number[], lam: number): number[] {
  const mn = Math.min(...y);
  const shift = mn < 0.01 ? 1 - mn : 0;
  return y.map((v) => {
    const x = v + shift;
    if (Math.abs(lam) < 1e-6) return Math.log(Math.max(1e-8, x));
    return (Math.pow(Math.max(1e-8, x), lam) - 1) / lam;
  });
}

export function linearDetrend(y: number[]): { resid: number[]; a: number; b: number; fitted: number[] } {
  const n = y.length;
  const X = Array.from({ length: n }, (_, i) => [1, i]);
  const coef = ridgeFit(X, y, 0) ?? [mean(y), 0];
  const a = coef[0];
  const b = coef[1];
  const fitted = y.map((_, i) => a + b * i);
  const resid = y.map((v, i) => v - fitted[i]);
  return { resid, a, b, fitted };
}

export function maDetrend(y: number[], w: number): { resid: number[]; trend: (number | null)[] } {
  const half = Math.floor(w / 2);
  const trend = y.map((_, t) => {
    const a = t - half;
    const b = t + half + 1;
    if (a < 0 || b > y.length) return null;
    return mean(y.slice(a, b));
  });
  const resid = y.map((v, i) => (trend[i] == null ? 0 : v - (trend[i] as number)));
  return { resid, trend };
}

export function rolling(y: number[], w: number, fn: (s: number[]) => number): (number | null)[] {
  return y.map((_, i) => {
    if (i + 1 < w) return null;
    return fn(y.slice(i + 1 - w, i + 1));
  });
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
}

export function aicSigma(resid: number[], k: number) {
  const n = resid.length;
  const sse = resid.reduce((s, e) => s + e * e, 0);
  const sig2 = sse / Math.max(1, n);
  const nll = (n / 2) * Math.log(Math.max(1e-12, sig2));
  const aic = 2 * nll + 2 * k;
  const bic = 2 * nll + k * Math.log(n);
  return { aic, bic, sse };
}

export function slowAcfDecay(y: number[]): boolean {
  const r = acf(y, Math.min(20, Math.floor(y.length / 4)));
  return r.slice(1, 8).every((v) => v > 0.4);
}

export function halvesMoments(y: number[]) {
  const mid = Math.floor(y.length / 2);
  const a = y.slice(0, mid);
  const b = y.slice(mid);
  return {
    meanA: mean(a),
    meanB: mean(b),
    sdA: stdev(a),
    sdB: stdev(b),
  };
}
