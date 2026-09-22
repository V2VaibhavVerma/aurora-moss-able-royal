import { ridgeFit } from "@/lib/forecast/math";

export function granger(y: number[], x: number[], p: number) {
  const n = Math.min(y.length, x.length);
  const Y: number[] = [];
  const XR: number[][] = [];
  const XU: number[][] = [];
  for (let t = p; t < n; t++) {
    const r = [1];
    const u = [1];
    for (let i = 1; i <= p; i++) {
      r.push(y[t - i]);
      u.push(y[t - i]);
    }
    for (let i = 1; i <= p; i++) u.push(x[t - i]);
    XR.push(r);
    XU.push(u);
    Y.push(y[t]);
  }
  const br = ridgeFit(XR, Y, 0.0001);
  const bu = ridgeFit(XU, Y, 0.0001);
  if (!br || !bu) return { f: 0, pval: 1, rssR: 0, rssU: 0, helps: false };
  let rssR = 0;
  let rssU = 0;
  for (let i = 0; i < Y.length; i++) {
    const yr = br.reduce((s, b, j) => s + b * XR[i][j], 0);
    const yu = bu.reduce((s, b, j) => s + b * XU[i][j], 0);
    rssR += (Y[i] - yr) ** 2;
    rssU += (Y[i] - yu) ** 2;
  }
  const q = p;
  const df = Y.length - (1 + 2 * p);
  const f = ((rssR - rssU) / q) / (rssU / Math.max(1, df));
  const pval = fCdfTail(f, q, Math.max(1, df));
  return { f, pval, rssR, rssU, helps: pval < 0.05 };
}

function fCdfTail(f: number, d1: number, d2: number): number {
  // rough: convert to regularized beta
  const x = d2 / (d2 + d1 * f);
  return incompleteBeta(x, d2 / 2, d1 / 2);
}

function incompleteBeta(x: number, a: number, b: number): number {
  // continued fraction approximation (small, teaching-grade)
  x = Math.min(1, Math.max(0, x));
  if (x === 0) return 0;
  if (x === 1) return 1;
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;
  let f = 1;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  f = d;
  for (let m = 1; m <= 80; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    c = 1 + aa / c;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    f *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    c = 1 + aa / c;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    f *= del;
    if (Math.abs(del - 1) < 1e-8) break;
  }
  return Math.min(1, Math.max(0, front * f));
}

function logGamma(z: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.001208650973866179, -5.395239384953e-6,
  ];
  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
