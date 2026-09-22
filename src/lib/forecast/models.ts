import type { LabParams, Point } from "./types";
import { addMonths } from "./dates";
import { clip0, mean, ridgeFit, dot } from "./math";

export function persistForecast(y: number[], h: number): number[] {
  const last = y.length ? y[y.length - 1] : 0;
  return Array(h).fill(last);
}

export function meanForecast(y: number[], h: number, window: number): number[] {
  const w = Math.max(1, Math.min(window, y.length));
  const m = mean(y.slice(-w));
  return Array(h).fill(m);
}

export function snaiveForecast(
  series: Point[],
  months: string[],
  period = 12,
): number[] {
  const map = new Map(series.map((p) => [p.t, p.sales]));
  return months.map((t) => {
    const key = addMonths(t, -period);
    if (map.has(key)) return map.get(key)!;
    const last = series[series.length - 1];
    return last ? last.sales : 0;
  });
}

export function sesForecast(y: number[], h: number, alpha: number): number[] {
  if (!y.length) return Array(h).fill(0);
  const a = Math.min(0.99, Math.max(0.01, alpha));
  let l = y[0];
  for (let i = 1; i < y.length; i++) l = a * y[i] + (1 - a) * l;
  return Array(h).fill(l);
}

export function ewmaForecast(y: number[], h: number, span: number): number[] {
  const alpha = 2 / (Math.max(1, span) + 1);
  return sesForecast(y, h, alpha);
}

export function crostonForecast(y: number[], h: number, window: number): number[] {
  const w = y.slice(-Math.max(1, Math.min(window, y.length)));
  const pos = w.filter((v) => v > 0);
  const p = w.length ? pos.length / w.length : 0;
  const size = pos.length ? mean(pos) : 0;
  return Array(h).fill(p * size);
}

function hwInit(y: number[], m: number) {
  const season = Math.min(m, y.length);
  const L0 = mean(y.slice(0, season));
  let T0 = 0;
  if (y.length >= 2 * m) {
    T0 = (mean(y.slice(m, 2 * m)) - mean(y.slice(0, m))) / m;
  } else if (y.length > 1) {
    T0 = (y[y.length - 1] - y[0]) / Math.max(1, y.length - 1);
  }
  const S: number[] = [];
  for (let i = 0; i < m; i++) S.push((y[i] ?? L0) - L0);
  return { L0, T0, S };
}

export function holtWintersForecast(
  y: number[],
  h: number,
  opts: {
    trend: boolean;
    seasonal: boolean;
    damped: boolean;
    phi: number;
    m: number;
    alpha: number;
    beta: number;
    gamma: number;
  },
): number[] {
  if (!y.length) return Array(h).fill(0);
  const m = Math.max(2, opts.m);
  const { L0, T0, S } = hwInit(y, m);
  let L = L0;
  let T = opts.trend ? T0 : 0;
  const seas = S.slice();
  const a = opts.alpha;
  const b = opts.beta;
  const g = opts.gamma;
  const phi = opts.damped ? Math.min(0.98, Math.max(0.5, opts.phi)) : 1;
  for (let t = 0; t < y.length; t++) {
    const s = opts.seasonal ? seas[t % m] : 0;
    const yt = y[t];
    const prevL = L;
    const Td = phi * T;
    L = a * (yt - s) + (1 - a) * (prevL + Td);
    if (opts.trend) T = b * (L - prevL) + (1 - b) * Td;
    else T = 0;
    if (opts.seasonal) seas[t % m] = g * (yt - L) + (1 - g) * s;
  }
  const out: number[] = [];
  for (let k = 1; k <= h; k++) {
    let tsum = 0;
    if (opts.trend) {
      let p = phi;
      for (let i = 1; i <= k; i++) {
        tsum += p;
        p *= phi;
      }
    }
    const s = opts.seasonal ? seas[(y.length + k - 1) % m] : 0;
    out.push(L + tsum * T + s);
  }
  return out;
}

function hwSse(y: number[], opts: Parameters<typeof holtWintersForecast>[2]): number {
  if (y.length < 8) return Infinity;
  let sse = 0;
  const cut = Math.max(8, y.length - 6);
  const pred = holtWintersForecast(y.slice(0, cut), y.length - cut, opts);
  for (let i = 0; i < pred.length; i++) {
    const e = y[cut + i] - pred[i];
    sse += e * e;
  }
  return sse;
}

export function holtWintersAuto(
  y: number[],
  h: number,
  base: Parameters<typeof holtWintersForecast>[2],
): number[] {
  let best = { ...base };
  let bestSse = Infinity;
  const grid = [0.05, 0.2, 0.4, 0.7];
  for (const a of grid) {
    for (const b of base.trend ? grid : [0]) {
      for (const g of base.seasonal ? grid : [0]) {
        const opts = { ...base, alpha: a, beta: b, gamma: g };
        const sse = hwSse(y, opts);
        if (sse < bestSse) {
          bestSse = sse;
          best = opts;
        }
      }
    }
  }
  return holtWintersForecast(y, h, best);
}

function difference(y: number[], d: number): number[] {
  let cur = y.slice();
  for (let k = 0; k < d; k++) {
    const n: number[] = [];
    for (let i = 1; i < cur.length; i++) n.push(cur[i] - cur[i - 1]);
    cur = n;
  }
  return cur;
}

function invertDiff(history: number[], diffs: number[], d: number): number[] {
  if (d <= 0) return diffs.slice();
  const out: number[] = [];
  let last = history[history.length - 1] ?? 0;
  if (d === 1) {
    for (const e of diffs) {
      last = last + e;
      out.push(last);
    }
    return out;
  }
  // d=2: second diffs; rebuild first diffs then levels
  const firstHist = difference(history, 1);
  let lastD1 = firstHist[firstHist.length - 1] ?? 0;
  const first: number[] = [];
  for (const e of diffs) {
    lastD1 = lastD1 + e;
    first.push(lastD1);
  }
  return invertDiff(history, first, 1);
}

export function arimaForecast(
  y: number[],
  h: number,
  p: number,
  d: number,
  q: number,
): number[] {
  if (y.length < 4) return persistForecast(y, h);
  const dd = Math.min(2, Math.max(0, d));
  const pp = Math.min(3, Math.max(0, p));
  const qq = Math.min(3, Math.max(0, q));
  const z = difference(y, dd);
  if (z.length < pp + qq + 3) return persistForecast(y, h);

  // Hannan–Rissanen: long AR → residuals → OLS ARMA
  const arLong = Math.min(8, Math.floor(z.length / 3));
  const Xl: number[][] = [];
  const yl: number[] = [];
  for (let t = arLong; t < z.length; t++) {
    Xl.push([1, ...Array.from({ length: arLong }, (_, i) => z[t - 1 - i])]);
    yl.push(z[t]);
  }
  const bl = ridgeFit(Xl, yl, 0.01);
  const resid = Array(z.length).fill(0);
  if (bl) {
    for (let t = arLong; t < z.length; t++) {
      const x = [1, ...Array.from({ length: arLong }, (_, i) => z[t - 1 - i])];
      resid[t] = z[t] - dot(x, bl);
    }
  }

  const k = 1 + pp + qq;
  const X: number[][] = [];
  const yy: number[] = [];
  const start = Math.max(arLong, pp, qq);
  for (let t = start; t < z.length; t++) {
    const row = [1];
    for (let i = 1; i <= pp; i++) row.push(z[t - i]);
    for (let i = 1; i <= qq; i++) row.push(resid[t - i]);
    X.push(row);
    yy.push(z[t]);
  }
  const beta = ridgeFit(X, yy, 0.05);
  if (!beta) return persistForecast(y, h);

  const zHist = z.slice();
  const eHist = resid.slice();
  const zF: number[] = [];
  for (let step = 0; step < h; step++) {
    const row = [1];
    for (let i = 1; i <= pp; i++) {
      const idx = zHist.length - i;
      row.push(idx >= 0 ? zHist[idx] : 0);
    }
    for (let i = 1; i <= qq; i++) {
      const idx = eHist.length - i;
      row.push(idx >= 0 ? eHist[idx] : 0);
    }
    const yhat = dot(row, beta);
    zF.push(yhat);
    zHist.push(yhat);
    eHist.push(0);
  }
  return invertDiff(y, zF, dd);
}

export function sarimaForecast(
  y: number[],
  h: number,
  p: number,
  d: number,
  q: number,
  P: number,
  D: number,
  Q: number,
  s: number,
): number[] {
  const m = Math.max(2, s);
  let series = y.slice();
  const seasonalHist: number[][] = [];
  const DD = Math.min(1, Math.max(0, D));
  if (DD && series.length > m) {
    const diffed: number[] = [];
    for (let i = m; i < series.length; i++) diffed.push(series[i] - series[i - m]);
    seasonalHist.push(series.slice());
    series = diffed;
  }
  // seasonal AR/MA approximated by extra lag-m terms inside ARIMA via
  // prepending seasonal lag as additional AR if P>0
  const extraP = P > 0 ? p + 1 : p;
  let fc = arimaForecast(series, h, extraP, d, q + (Q > 0 ? 1 : 0));
  if (DD && seasonalHist.length) {
    const hist = seasonalHist[0];
    const out: number[] = [];
    const buf = hist.slice();
    for (let i = 0; i < h; i++) {
      const base = buf[buf.length - m] ?? buf[buf.length - 1] ?? 0;
      const val = base + fc[i];
      out.push(val);
      buf.push(val);
    }
    fc = out;
  }
  return fc;
}

type LinFeat = {
  y_l1: number;
  e_l1: number;
  e_l2: number;
  hol: number;
  t: number;
};

function featRow(f: LinFeat, p: LabParams): number[] {
  const row = [1];
  if (p.useYLag) row.push(f.y_l1);
  if (p.useEnrollL1) row.push(f.e_l1);
  if (p.useEnrollL2) row.push(f.e_l2);
  if (p.useHoliday) row.push(f.hol);
  if (p.useTrend) row.push(f.t);
  return row;
}

export function linearRecursive(
  series: Point[],
  walk: string[],
  holidayLookup: Map<string, number>,
  p: LabParams,
  lam: number,
): number[] {
  if (series.length < 4) return persistForecast(series.map((s) => s.sales), walk.length);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 2; i < series.length; i++) {
    const f: LinFeat = {
      y_l1: series[i - 1].sales,
      e_l1: series[i - 1].enrollments,
      e_l2: series[i - 2].enrollments,
      hol: series[i].holiday,
      t: i,
    };
    X.push(featRow(f, p));
    y.push(series[i].sales);
  }
  const beta = ridgeFit(X, y, lam);
  if (!beta) return persistForecast(series.map((s) => s.sales), walk.length);

  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  let y_l1 = last.sales;
  let e_l1 = last.enrollments;
  let e_l2 = prev.enrollments;
  const freezeN = Math.max(1, p.enrollFreezeWindow);
  const enrLvl = mean(series.slice(-freezeN).map((s) => s.enrollments));
  let t = series.length - 1;
  const out: number[] = [];
  for (const ts of walk) {
    t += 1;
    const hol =
      holidayLookup.get(ts) ??
      holidayLookup.get(addMonths(ts, -12)) ??
      0;
    const f: LinFeat = { y_l1, e_l1, e_l2, hol, t };
    const yhat = clip0(dot(featRow(f, p), beta), p.clipNegative);
    out.push(yhat);
    e_l2 = e_l1;
    e_l1 = enrLvl;
    y_l1 = yhat;
  }
  return out;
}

export function ensembleLevel(y: number[], h: number, p: LabParams): number[] {
  const a = meanForecast(y, h, 6);
  const b = meanForecast(y, h, 12);
  const c = ewmaForecast(y, h, p.ewmaSpan);
  const w6 = Math.max(0, p.wMean6);
  const w12 = Math.max(0, p.wMean12);
  const we = Math.max(0, p.wEwma);
  const s = w6 + w12 + we || 1;
  return a.map((_, i) => (w6 * a[i] + w12 * b[i] + we * c[i]) / s);
}

export function applyClip(pred: number[], on: boolean): number[] {
  return pred.map((v) => clip0(v, on));
}

export function holidayMap(series: Point[]): Map<string, number> {
  return new Map(series.map((p) => [p.t, p.holiday]));
}
