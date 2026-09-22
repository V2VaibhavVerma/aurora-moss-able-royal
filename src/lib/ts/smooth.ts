export function sma(y: number[], w: number): (number | null)[] {
  return y.map((_, t) => {
    if (t + 1 < w) return null;
    let s = 0;
    for (let i = t + 1 - w; i <= t; i++) s += y[i];
    return s / w;
  });
}

export function wma(y: number[], w: number): (number | null)[] {
  const den = (w * (w + 1)) / 2;
  return y.map((_, t) => {
    if (t + 1 < w) return null;
    let s = 0;
    for (let i = 0; i < w; i++) s += (i + 1) * y[t - w + 1 + i];
    return s / den;
  });
}

export function ema(y: number[], alpha: number): number[] {
  if (!y.length) return [];
  const a = Math.min(0.99, Math.max(0.01, alpha));
  const o = [y[0]];
  for (let t = 1; t < y.length; t++) o.push(a * y[t] + (1 - a) * o[t - 1]);
  return o;
}

export function sesForecast(y: number[], alpha: number, h: number) {
  const L = ema(y, alpha);
  const last = L[L.length - 1] ?? 0;
  return { fitted: L, forecast: Array(h).fill(last) };
}

export function holt(
  y: number[],
  alpha: number,
  beta: number,
  h: number,
  phi = 1,
) {
  let L = y[0] ?? 0;
  let T = (y[1] ?? y[0] ?? 0) - (y[0] ?? 0);
  const fitted: number[] = [L];
  const a = alpha;
  const b = beta;
  const p = Math.min(0.98, Math.max(0.5, phi));
  for (let t = 1; t < y.length; t++) {
    const prevL = L;
    L = a * y[t] + (1 - a) * (prevL + p * T);
    T = b * (L - prevL) + (1 - b) * p * T;
    fitted.push(L);
  }
  const fc: number[] = [];
  for (let k = 1; k <= h; k++) {
    let s = 0;
    let pk = p;
    for (let i = 1; i <= k; i++) {
      s += pk;
      pk *= p;
    }
    fc.push(L + s * T);
  }
  return { fitted, forecast: fc, L, T };
}

export function holtWinters(
  y: number[],
  m: number,
  alpha: number,
  beta: number,
  gamma: number,
  h: number,
  multiplicative: boolean,
) {
  const period = Math.max(2, m);
  const L0 = y.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let T =
    y.length >= 2 * period
      ? (y.slice(period, 2 * period).reduce((s, v) => s + v, 0) -
          y.slice(0, period).reduce((s, v) => s + v, 0)) /
        (period * period)
      : 0;
  let L = L0;
  const S = y.slice(0, period).map((v) => (multiplicative ? v / Math.max(1e-6, L0) : v - L0));
  const fitted: number[] = [];
  for (let t = 0; t < y.length; t++) {
    const s = S[t % period];
    const prevL = L;
    if (multiplicative) {
      L = alpha * (y[t] / Math.max(1e-6, s)) + (1 - alpha) * (prevL + T);
      T = beta * (L - prevL) + (1 - beta) * T;
      S[t % period] = gamma * (y[t] / Math.max(1e-6, L)) + (1 - gamma) * s;
      fitted.push(L * s);
    } else {
      L = alpha * (y[t] - s) + (1 - alpha) * (prevL + T);
      T = beta * (L - prevL) + (1 - beta) * T;
      S[t % period] = gamma * (y[t] - L) + (1 - gamma) * s;
      fitted.push(L + s);
    }
  }
  const fc: number[] = [];
  for (let k = 1; k <= h; k++) {
    const s = S[(y.length + k - 1) % period];
    fc.push(multiplicative ? (L + k * T) * s : L + k * T + s);
  }
  return { fitted, forecast: fc };
}
