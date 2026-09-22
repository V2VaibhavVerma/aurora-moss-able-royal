export function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
}

export function clip0(x: number, on: boolean): number {
  return on ? Math.max(0, x) : x;
}

export function mae(a: number[], p: number[]): number {
  const n = Math.min(a.length, p.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - p[i]);
  return s / n;
}

export function rmse(a: number[], p: number[]): number {
  const n = Math.min(a.length, p.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - p[i]) ** 2;
  return Math.sqrt(s / n);
}

export function bias(a: number[], p: number[]): number {
  const n = Math.min(a.length, p.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += p[i] - a[i];
  return s / n;
}

export function volWmae(a: number[], p: number[]): number {
  const n = Math.min(a.length, p.length);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += Math.abs(a[i] - p[i]);
    den += a[i];
  }
  return den === 0 ? num : num / den;
}

export function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
    }
    if (Math.abs(M[piv][i]) < 1e-12) return null;
    [M[i], M[piv]] = [M[piv], M[i]];
    const div = M[i][i];
    for (let c = i; c <= n; c++) M[i][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  return M.map((row) => row[n]);
}

export function ridgeFit(X: number[][], y: number[], lam: number): number[] | null {
  const n = X.length;
  const k = X[0]?.length ?? 0;
  if (!n || !k || n < k) return null;
  const A: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  const b = Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    for (let p = 0; p < k; p++) {
      b[p] += X[i][p] * y[i];
      for (let q = 0; q < k; q++) A[p][q] += X[i][p] * X[i][q];
    }
  }
  for (let j = 1; j < k; j++) A[j][j] += lam;
  return solve(A, b);
}

export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
