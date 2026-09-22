import { mean } from "@/lib/forecast/math";

function ma(y: number[], w: number): (number | null)[] {
  const half = Math.floor(w / 2);
  return y.map((_, t) => {
    const a = t - half;
    const b = t + half + (w % 2 === 0 ? 0 : 1);
    if (a < 0 || b > y.length) return null;
    if (w % 2 === 0) {
      const left = mean(y.slice(t - half, t + half));
      const right = mean(y.slice(t - half + 1, t + half + 1));
      return (left + right) / 2;
    }
    return mean(y.slice(a, b));
  });
}

export type Pieces = {
  observed: number[];
  trend: (number | null)[];
  seasonal: number[];
  resid: (number | null)[];
};

export function classicalDecompose(y: number[], period: number, multiplicative: boolean): Pieces {
  const m = Math.max(2, period);
  const trend = ma(y, m);
  const monthSum = Array(m).fill(0);
  const monthN = Array(m).fill(0);
  for (let t = 0; t < y.length; t++) {
    if (trend[t] == null) continue;
    const tr = trend[t] as number;
    const det = multiplicative ? y[t] / Math.max(1e-6, tr) : y[t] - tr;
    monthSum[t % m] += det;
    monthN[t % m] += 1;
  }
  const seas = monthSum.map((s, i) => (monthN[i] ? s / monthN[i] : multiplicative ? 1 : 0));
  if (!multiplicative) {
    const sm = mean(seas);
    for (let i = 0; i < m; i++) seas[i] -= sm;
  } else {
    const sm = mean(seas) || 1;
    for (let i = 0; i < m; i++) seas[i] /= sm;
  }
  const seasonal = y.map((_, t) => seas[t % m]);
  const resid = y.map((v, t) => {
    if (trend[t] == null) return null;
    const tr = trend[t] as number;
    return multiplicative ? v / Math.max(1e-6, tr * seasonal[t]) : v - tr - seasonal[t];
  });
  return { observed: y, trend, seasonal, resid };
}

function loess(x: number[], y: number[], xout: number[], span: number): number[] {
  const n = x.length;
  const k = Math.max(4, Math.min(n, Math.round(span * n)));
  return xout.map((xq) => {
    const dist = x.map((xi) => Math.abs(xi - xq));
    const order = dist.map((_, i) => i).sort((a, b) => dist[a] - dist[b]);
    const h = dist[order[k - 1]] || 1e-6;
    let s0 = 0,
      s1 = 0,
      s2 = 0,
      t0 = 0,
      t1 = 0;
    for (let j = 0; j < k; j++) {
      const i = order[j];
      const u = Math.min(1, dist[i] / h);
      const w = (1 - u * u * u) ** 3;
      const xi = x[i] - xq;
      s0 += w;
      s1 += w * xi;
      s2 += w * xi * xi;
      t0 += w * y[i];
      t1 += w * xi * y[i];
    }
    const det = s0 * s2 - s1 * s1;
    if (Math.abs(det) < 1e-12) return t0 / (s0 || 1);
    const a = (t0 * s2 - t1 * s1) / det;
    return a;
  });
}

export function stlLite(
  y: number[],
  period: number,
  seasonalSpan: number,
  trendSpan: number,
  robust: boolean,
): Pieces {
  const m = Math.max(2, period);
  const n = y.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  let seasonal = Array(n).fill(0);
  let trend = Array(n).fill(mean(y));
  const w = Array(n).fill(1);
  for (let iter = 0; iter < (robust ? 4 : 2); iter++) {
    const detrend = y.map((v, i) => v - trend[i]);
    for (let k = 0; k < m; k++) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let t = k; t < n; t += m) {
        xs.push(t);
        ys.push(detrend[t] * w[t]);
      }
      if (xs.length < 3) continue;
      const fit = loess(xs, ys, xs, seasonalSpan);
      xs.forEach((t, j) => {
        seasonal[t] = fit[j];
      });
    }
    const sm = mean(seasonal);
    seasonal = seasonal.map((s) => s - sm);
    const seasAdj = y.map((v, i) => v - seasonal[i]);
    trend = loess(idx, seasAdj, idx, trendSpan);
    if (robust) {
      const r = y.map((v, i) => v - trend[i] - seasonal[i]);
      const abs = r.map(Math.abs).sort((a, b) => a - b);
      const med = abs[Math.floor(abs.length / 2)] || 1;
      const mad = med * 6 || 1;
      for (let i = 0; i < n; i++) {
        const u = Math.min(1, Math.abs(r[i]) / mad);
        w[i] = (1 - u * u) ** 2;
      }
    }
  }
  const resid = y.map((v, i) => v - trend[i] - seasonal[i]);
  return { observed: y, trend, seasonal, resid };
}

export function leftoverSeason(resid: (number | null)[], period: number): number {
  const r = resid.filter((v): v is number => v != null);
  if (r.length < period * 2) return 0;
  const m = period;
  const by = Array.from({ length: m }, () => [] as number[]);
  resid.forEach((v, t) => {
    if (v != null) by[t % m].push(v);
  });
  const means = by.map((a) => (a.length ? mean(a) : 0));
  const v = means.reduce((s, x) => s + x * x, 0) / m;
  const rv = r.reduce((s, x) => s + x * x, 0) / r.length || 1;
  return v / rv;
}
