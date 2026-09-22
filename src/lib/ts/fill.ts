export function forwardFill(y: (number | null)[]): number[] {
  const o: number[] = [];
  let last = 0;
  for (const v of y) {
    if (v == null) o.push(last);
    else {
      last = v;
      o.push(v);
    }
  }
  return o;
}

export function linearFill(y: (number | null)[]): number[] {
  const o = y.slice();
  let i = 0;
  while (i < o.length) {
    if (o[i] != null) {
      i++;
      continue;
    }
    let j = i;
    while (j < o.length && o[j] == null) j++;
    const left = i > 0 ? (o[i - 1] as number) : ((o[j] as number) ?? 0);
    const right = j < o.length ? (o[j] as number) : left;
    const span = j - i + 1;
    for (let k = i; k < j; k++) {
      const w = (k - i + 1) / span;
      o[k] = left * (1 - w) + right * w;
    }
    i = j;
  }
  return o.map((v) => (v == null ? 0 : v));
}

export function seasonalFill(y: (number | null)[], m: number): number[] {
  const o = y.slice();
  for (let i = 0; i < o.length; i++) {
    if (o[i] != null) continue;
    const prev = i >= m ? o[i - m] : null;
    const next = i + m < o.length ? o[i + m] : null;
    if (prev != null && next != null) o[i] = 0.5 * (prev + next);
    else if (prev != null) o[i] = prev;
    else if (next != null) o[i] = next;
    else o[i] = 0;
  }
  return o.map((v) => (v == null ? 0 : v));
}

export function resampleSum(y: number[], k: number): number[] {
  const o: number[] = [];
  for (let i = 0; i < y.length; i += k) {
    o.push(y.slice(i, i + k).reduce((s, v) => s + v, 0));
  }
  return o;
}

export function winsor(y: number[], q = 0.05): number[] {
  const s = y.slice().sort((a, b) => a - b);
  const lo = s[Math.floor(q * s.length)];
  const hi = s[Math.floor((1 - q) * s.length)];
  return y.map((v) => Math.min(hi, Math.max(lo, v)));
}
