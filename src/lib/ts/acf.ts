import { mean } from "@/lib/forecast/math";
import { chi2Sf } from "./chi2";

export function acf(y: number[], maxLag: number): number[] {
  const m = mean(y);
  const z = y.map((v) => v - m);
  const c0 = z.reduce((s, v) => s + v * v, 0) || 1e-12;
  const r = [1];
  for (let k = 1; k <= maxLag; k++) {
    let c = 0;
    for (let t = k; t < z.length; t++) c += z[t] * z[t - k];
    r.push(c / c0);
  }
  return r;
}

export function pacf(y: number[], maxLag: number): number[] {
  const r = acf(y, maxLag);
  const p = [1];
  const phi: number[][] = [];
  for (let k = 1; k <= maxLag; k++) {
    phi[k] = [];
    if (k === 1) {
      phi[1][1] = r[1];
    } else {
      let num = r[k];
      let den = 1;
      for (let j = 1; j < k; j++) {
        num -= (phi[k - 1][j] ?? 0) * r[k - j];
        den -= (phi[k - 1][j] ?? 0) * r[j];
      }
      phi[k][k] = num / (den || 1e-12);
      for (let j = 1; j < k; j++) {
        phi[k][j] = (phi[k - 1][j] ?? 0) - phi[k][k] * (phi[k - 1][k - j] ?? 0);
      }
    }
    p.push(phi[k][k]);
  }
  return p;
}

export function ljungBox(y: number[], h: number): { q: number; df: number; p: number } {
  const n = y.length;
  const r = acf(y, h);
  let q = 0;
  for (let k = 1; k <= h; k++) {
    q += (r[k] * r[k]) / (n - k);
  }
  q *= n * (n + 2);
  const df = h;
  return { q, df, p: chi2Sf(q, df) };
}

export function band(n: number): number {
  return 1.96 / Math.sqrt(n);
}

export function cutoffLag(vals: number[], n: number, from = 1): number {
  const b = band(n);
  let last = 0;
  for (let k = from; k < vals.length; k++) {
    if (Math.abs(vals[k]) > b) last = k;
  }
  for (let k = from; k < vals.length; k++) {
    if (Math.abs(vals[k]) > b) continue;
    let quiet = true;
    for (let j = k; j < Math.min(vals.length, k + 3); j++) {
      if (Math.abs(vals[j]) > b) quiet = false;
    }
    if (quiet) return k - 1;
  }
  return last;
}
