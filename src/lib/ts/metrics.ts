export function mae(actual: number[], pred: number[]): number {
  const n = Math.min(actual.length, pred.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(actual[i] - pred[i]);
  return s / n;
}

export function mse(actual: number[], pred: number[]): number {
  const n = Math.min(actual.length, pred.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const e = actual[i] - pred[i];
    s += e * e;
  }
  return s / n;
}

export function rmse(actual: number[], pred: number[]): number {
  return Math.sqrt(mse(actual, pred));
}

export function mape(actual: number[], pred: number[]): number | null {
  const n = Math.min(actual.length, pred.length);
  if (!n) return null;
  let s = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (Math.abs(actual[i]) < 1e-8) return null;
    s += Math.abs(actual[i] - pred[i]) / Math.abs(actual[i]);
    k++;
  }
  return k ? (100 * s) / k : null;
}

export function smape(actual: number[], pred: number[]): number {
  const n = Math.min(actual.length, pred.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const den = Math.abs(actual[i]) + Math.abs(pred[i]);
    s += den < 1e-12 ? 0 : (2 * Math.abs(actual[i] - pred[i])) / den;
  }
  return (100 * s) / n;
}

export function mase(actual: number[], pred: number[], season = 1): number {
  const n = Math.min(actual.length, pred.length);
  if (n < 2) return 0;
  const maeM = mae(actual, pred);
  let s = 0;
  let k = 0;
  for (let t = season; t < actual.length; t++) {
    s += Math.abs(actual[t] - actual[t - season]);
    k++;
  }
  const scale = k ? s / k : 1;
  return maeM / Math.max(1e-8, scale);
}

export function aicFromResid(resid: number[], k: number) {
  const n = resid.length;
  const sse = resid.reduce((s, e) => s + e * e, 0);
  const sig2 = sse / Math.max(1, n);
  const nll = (n / 2) * (Math.log(2 * Math.PI) + Math.log(Math.max(1e-12, sig2)) + 1);
  const aic = 2 * nll + 2 * k;
  const bic = 2 * nll + k * Math.log(Math.max(2, n));
  const aicc = aic + (2 * k * (k + 1)) / Math.max(1, n - k - 1);
  return { aic, bic, aicc, sse, sig2, n, k };
}
