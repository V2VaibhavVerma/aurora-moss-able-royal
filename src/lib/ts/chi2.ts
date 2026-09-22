/** Regularized lower gamma P(s,x) via series; teaching-grade. */
function gammaLn(z: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179,
    -5.395239384953e-6,
  ];
  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function lowerGammaReg(s: number, x: number): number {
  if (x <= 0) return 0;
  let sum = 1 / s;
  let term = 1 / s;
  for (let n = 1; n < 220; n++) {
    term *= x / (s + n);
    sum += term;
    if (Math.abs(term) < 1e-14 * (Math.abs(sum) + 1)) break;
  }
  const val = sum * Math.exp(-x + s * Math.log(Math.max(1e-12, x)) - gammaLn(s));
  return Math.min(1, Math.max(0, val));
}

/** Survival P(X > q) for X ~ chi-square(df). */
export function chi2Sf(q: number, df: number): number {
  if (q <= 0) return 1;
  if (df <= 0) return 1;
  return 1 - lowerGammaReg(df / 2, q / 2);
}
