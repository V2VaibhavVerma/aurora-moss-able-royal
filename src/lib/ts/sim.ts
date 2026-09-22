import { gaussian, mulberry32, range } from "./rng";

export type ProcessKind =
  | "white"
  | "ar1"
  | "ar2"
  | "ma1"
  | "ma2"
  | "arma11"
  | "rw"
  | "rwdrift"
  | "trend"
  | "season"
  | "multi"
  | "cycle"
  | "break";

export function simulate(
  kind: ProcessKind,
  n: number,
  seed: number,
  p: {
    phi?: number;
    phi2?: number;
    theta?: number;
    theta2?: number;
    sigma?: number;
    drift?: number;
    slope?: number;
    seasonAmp?: number;
    period?: number;
    cycleAmp?: number;
    cycleLen?: number;
    level?: number;
    jumpAt?: number;
    jumpSize?: number;
  } = {},
): number[] {
  const rand = mulberry32(seed);
  const g = gaussian(rand);
  const sigma = p.sigma ?? 1;
  const phi = p.phi ?? 0.7;
  const phi2 = p.phi2 ?? -0.2;
  const theta = p.theta ?? 0.6;
  const theta2 = p.theta2 ?? 0.3;
  const y: number[] = [];
  let ePrev = 0;
  let ePrev2 = 0;
  const period = p.period ?? 12;
  const seasonAmp = p.seasonAmp ?? 8;
  const level = p.level ?? 20;
  for (let t = 0; t < n; t++) {
    const e = sigma * g();
    const seas = seasonAmp * Math.sin((2 * Math.PI * t) / period);
    const cyc = (p.cycleAmp ?? 0) * Math.sin((2 * Math.PI * t) / (p.cycleLen ?? 48));
    let v = 0;
    const prev = y[t - 1] ?? 0;
    const prev2 = y[t - 2] ?? 0;
    switch (kind) {
      case "white":
        v = e;
        break;
      case "ar1":
        v = phi * prev + e;
        break;
      case "ar2":
        v = phi * prev + phi2 * prev2 + e;
        break;
      case "ma1":
        v = e + theta * ePrev;
        break;
      case "ma2":
        v = e + theta * ePrev + theta2 * ePrev2;
        break;
      case "arma11":
        v = phi * prev + e + theta * ePrev;
        break;
      case "rw":
        v = prev + e;
        break;
      case "rwdrift":
        v = prev + (p.drift ?? 0.08) + e;
        break;
      case "trend":
        v = level + (p.slope ?? 0.12) * t + e;
        break;
      case "season":
        v = level + (p.slope ?? 0.05) * t + seas + cyc + e;
        break;
      case "multi": {
        const T = Math.max(0.2, level + (p.slope ?? 0.15) * t);
        v = T * (1 + 0.04 * seasonAmp * Math.sin((2 * Math.PI * t) / period)) + e;
        break;
      }
      case "cycle":
        v = level + (p.slope ?? 0.04) * t + seas + cyc + e;
        break;
      case "break":
        v = level + (p.slope ?? 0.04) * t + seas + e;
        if (t >= (p.jumpAt ?? Math.floor(n * 0.45))) v += p.jumpSize ?? 12;
        break;
    }
    y.push(v);
    ePrev2 = ePrev;
    ePrev = e;
  }
  return y;
}

export function bivariateVAR(
  n: number,
  seed: number,
  axy: number,
  ayx: number,
  sigma = 1,
): { x: number[]; y: number[] } {
  const g = gaussian(mulberry32(seed));
  const x: number[] = [0];
  const y: number[] = [0];
  for (let t = 1; t < n; t++) {
    const ex = sigma * g();
    const ey = sigma * g();
    x.push(0.4 * x[t - 1] + axy * y[t - 1] + ex);
    y.push(0.35 * y[t - 1] + ayx * x[t - 1] + ey);
  }
  return { x, y };
}

export function withMissing(y: number[], frac: number, seed: number, block = false): (number | null)[] {
  const rand = mulberry32(seed + 99);
  const out: (number | null)[] = y.slice();
  if (block) {
    const start = Math.floor(rand() * (y.length * 0.6));
    const len = Math.max(4, Math.floor(y.length * frac));
    for (let i = start; i < Math.min(y.length, start + len); i++) out[i] = null;
    return out;
  }
  for (let i = 0; i < y.length; i++) {
    if (rand() < frac) out[i] = null;
  }
  return out;
}

export function injectOutlier(y: number[], at: number, size: number): number[] {
  const o = y.slice();
  const i = Math.max(0, Math.min(o.length - 1, at));
  o[i] += size;
  return o;
}

export function shuffle(y: number[], seed: number): number[] {
  const rand = mulberry32(seed);
  const o = y.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export { range };
