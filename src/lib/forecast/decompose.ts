import { mean, variance } from "./math";

export type Decomp = {
  observed: number[];
  trend: (number | null)[];
  seasonal: number[];
  resid: (number | null)[];
  seasonByMonth: number[];
  seasonStrength: number;
  trendStrength: number;
};

export function additiveDecompose(y: number[], period = 12): Decomp {
  const n = y.length;
  const m = period;
  const trend: (number | null)[] = Array(n).fill(null);
  const half = Math.floor(m / 2);
  for (let t = half; t < n - half; t++) {
    const slice = y.slice(t - half, t + half + (m % 2 === 0 ? 0 : 1));
    if (m % 2 === 0) {
      // 2x12 MA
      const left = mean(y.slice(t - half, t + half));
      const right = mean(y.slice(t - half + 1, t + half + 1));
      trend[t] = (left + right) / 2;
    } else {
      trend[t] = mean(slice);
    }
  }
  const monthSum = Array(m).fill(0);
  const monthN = Array(m).fill(0);
  for (let t = 0; t < n; t++) {
    if (trend[t] == null) continue;
    monthSum[t % m] += y[t] - (trend[t] as number);
    monthN[t % m] += 1;
  }
  const seasonByMonth = monthSum.map((s, i) => (monthN[i] ? s / monthN[i] : 0));
  const sMean = mean(seasonByMonth);
  for (let i = 0; i < m; i++) seasonByMonth[i] -= sMean;
  const seasonal = y.map((_, t) => seasonByMonth[t % m]);
  const resid: (number | null)[] = y.map((v, t) =>
    trend[t] == null ? null : v - (trend[t] as number) - seasonal[t],
  );
  const rVals = resid.filter((v): v is number => v != null);
  const sPlusR = seasonal
    .map((s, t) => (resid[t] == null ? null : s + (resid[t] as number)))
    .filter((v): v is number => v != null);
  const tPlusR = trend
    .map((tr, t) =>
      tr == null || resid[t] == null ? null : tr + (resid[t] as number),
    )
    .filter((v): v is number => v != null);
  const seasonStrength =
    1 - variance(rVals) / Math.max(1e-9, variance(sPlusR.length ? sPlusR : rVals));
  const trendStrength =
    1 - variance(rVals) / Math.max(1e-9, variance(tPlusR.length ? tPlusR : rVals));
  return {
    observed: y,
    trend,
    seasonal,
    resid,
    seasonByMonth,
    seasonStrength: Math.max(0, Math.min(1, seasonStrength)),
    trendStrength: Math.max(0, Math.min(1, trendStrength)),
  };
}
