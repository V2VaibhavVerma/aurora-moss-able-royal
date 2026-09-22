import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Menu } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-LF8mzLf_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
			outline: "border border-border bg-transparent hover:bg-accent",
			subtle: "bg-secondary text-foreground hover:bg-accent"
		},
		size: {
			default: "h-10 px-3.5",
			sm: "h-8 px-2.5 text-xs",
			icon: "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var CHAPTERS = [
	{
		id: 1,
		slug: "object",
		title: "Time series",
		blurb: "Order is the information."
	},
	{
		id: 2,
		slug: "decomp",
		title: "Decomposition",
		blurb: "Trend, season, cycle, leftover."
	},
	{
		id: 3,
		slug: "stl",
		title: "STL",
		blurb: "LOESS twice. Residual is the verdict."
	},
	{
		id: 4,
		slug: "stationarity",
		title: "Stationarity",
		blurb: "Same rules next year."
	},
	{
		id: 5,
		slug: "noise",
		title: "White noise",
		blurb: "Stacked shocks, or not."
	},
	{
		id: 6,
		slug: "models",
		title: "ARIMA family",
		blurb: "What does it remember?"
	},
	{
		id: 7,
		slug: "smooth",
		title: "Smoothing",
		blurb: "Level, slope, season as state."
	},
	{
		id: 8,
		slug: "granger",
		title: "Granger",
		blurb: "Predictive content, not cause."
	},
	{
		id: 9,
		slug: "acf",
		title: "ACF / PACF",
		blurb: "Read p, d, q, m from plots."
	},
	{
		id: 10,
		slug: "eval",
		title: "Evaluation",
		blurb: "Score a future it did not see."
	}
];
function mean(xs) {
	if (!xs.length) return 0;
	return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function solve(A, b) {
	const n = b.length;
	const M = A.map((row, i) => [...row, b[i]]);
	for (let i = 0; i < n; i++) {
		let piv = i;
		for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
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
function ridgeFit(X, y, lam) {
	const n = X.length;
	const k = X[0]?.length ?? 0;
	if (!n || !k || n < k) return null;
	const A = Array.from({ length: k }, () => Array(k).fill(0));
	const b = Array(k).fill(0);
	for (let i = 0; i < n; i++) for (let p = 0; p < k; p++) {
		b[p] += X[i][p] * y[i];
		for (let q = 0; q < k; q++) A[p][q] += X[i][p] * X[i][q];
	}
	for (let j = 1; j < k; j++) A[j][j] += lam;
	return solve(A, b);
}
/** Regularized lower gamma P(s,x) via series; teaching-grade. */
function gammaLn(z) {
	const c = [
		76.18009172947146,
		-86.50532032941678,
		24.01409824083091,
		-1.231739572450155,
		.001208650973866179,
		-5395239384953e-18
	];
	let x = z;
	let y = z;
	let tmp = x + 5.5;
	tmp -= (x + .5) * Math.log(tmp);
	let ser = 1.000000000190015;
	for (let j = 0; j < 6; j++) ser += c[j] / ++y;
	return -tmp + Math.log(2.5066282746310007 * ser / x);
}
function lowerGammaReg(s, x) {
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
function chi2Sf(q, df) {
	if (q <= 0) return 1;
	if (df <= 0) return 1;
	return 1 - lowerGammaReg(df / 2, q / 2);
}
function acf(y, maxLag) {
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
function pacf(y, maxLag) {
	const r = acf(y, maxLag);
	const p = [1];
	const phi = [];
	for (let k = 1; k <= maxLag; k++) {
		phi[k] = [];
		if (k === 1) phi[1][1] = r[1];
		else {
			let num = r[k];
			let den = 1;
			for (let j = 1; j < k; j++) {
				num -= (phi[k - 1][j] ?? 0) * r[k - j];
				den -= (phi[k - 1][j] ?? 0) * r[j];
			}
			phi[k][k] = num / (den || 1e-12);
			for (let j = 1; j < k; j++) phi[k][j] = (phi[k - 1][j] ?? 0) - phi[k][k] * (phi[k - 1][k - j] ?? 0);
		}
		p.push(phi[k][k]);
	}
	return p;
}
function ljungBox(y, h) {
	const n = y.length;
	const r = acf(y, h);
	let q = 0;
	for (let k = 1; k <= h; k++) q += r[k] * r[k] / (n - k);
	q *= n * (n + 2);
	const df = h;
	return {
		q,
		df,
		p: chi2Sf(q, df)
	};
}
function band(n) {
	return 1.96 / Math.sqrt(n);
}
function mulberry32(seed) {
	let a = seed >>> 0;
	return function next() {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function gaussian(rand) {
	return function draw() {
		const u = Math.max(1e-12, rand());
		const v = rand();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	};
}
function simulate(kind, n, seed, p = {}) {
	const g = gaussian(mulberry32(seed));
	const sigma = p.sigma ?? 1;
	const phi = p.phi ?? .7;
	const phi2 = p.phi2 ?? -.2;
	const theta = p.theta ?? .6;
	const theta2 = p.theta2 ?? .3;
	const y = [];
	let ePrev = 0;
	let ePrev2 = 0;
	const period = p.period ?? 12;
	const seasonAmp = p.seasonAmp ?? 8;
	const level = p.level ?? 20;
	for (let t = 0; t < n; t++) {
		const e = sigma * g();
		const seas = seasonAmp * Math.sin(2 * Math.PI * t / period);
		const cyc = (p.cycleAmp ?? 0) * Math.sin(2 * Math.PI * t / (p.cycleLen ?? 48));
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
				v = prev + (p.drift ?? .08) + e;
				break;
			case "trend":
				v = level + (p.slope ?? .12) * t + e;
				break;
			case "season":
				v = level + (p.slope ?? .05) * t + seas + cyc + e;
				break;
			case "multi":
				v = Math.max(.2, level + (p.slope ?? .15) * t) * (1 + .04 * seasonAmp * Math.sin(2 * Math.PI * t / period)) + e;
				break;
			case "cycle":
				v = level + (p.slope ?? .04) * t + seas + cyc + e;
				break;
			case "break":
				v = level + (p.slope ?? .04) * t + seas + e;
				if (t >= (p.jumpAt ?? Math.floor(n * .45))) v += p.jumpSize ?? 12;
		}
		y.push(v);
		ePrev2 = ePrev;
		ePrev = e;
	}
	return y;
}
function bivariateVAR(n, seed, axy, ayx, sigma = 1) {
	const g = gaussian(mulberry32(seed));
	const x = [0];
	const y = [0];
	for (let t = 1; t < n; t++) {
		const ex = sigma * g();
		const ey = sigma * g();
		x.push(.4 * x[t - 1] + axy * y[t - 1] + ex);
		y.push(.35 * y[t - 1] + ayx * x[t - 1] + ey);
	}
	return {
		x,
		y
	};
}
function withMissing(y, frac, seed, block = false) {
	const rand = mulberry32(seed + 99);
	const out = y.slice();
	if (block) {
		const start = Math.floor(rand() * (y.length * .6));
		const len = Math.max(4, Math.floor(y.length * frac));
		for (let i = start; i < Math.min(y.length, start + len); i++) out[i] = null;
		return out;
	}
	for (let i = 0; i < y.length; i++) if (rand() < frac) out[i] = null;
	return out;
}
function injectOutlier(y, at, size) {
	const o = y.slice();
	const i = Math.max(0, Math.min(o.length - 1, at));
	o[i] += size;
	return o;
}
function shuffle(y, seed) {
	const rand = mulberry32(seed);
	const o = y.slice();
	for (let i = o.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[o[i], o[j]] = [o[j], o[i]];
	}
	return o;
}
function olsSimple(y, includeTrend) {
	const n = y.length;
	const X = [];
	const yy = [];
	for (let t = 1; t < n; t++) {
		const row = [1, y[t - 1]];
		if (includeTrend) row.push(t);
		X.push(row);
		yy.push(y[t] - y[t - 1]);
	}
	const b = ridgeFit(X, yy, 1e-4);
	if (!b) return {
		tstat: 0,
		gamma: 0
	};
	let sse = 0;
	for (let i = 0; i < X.length; i++) {
		const yh = b.reduce((s, bj, j) => s + bj * X[i][j], 0);
		sse += (yy[i] - yh) ** 2;
	}
	const k = b.length;
	const s2 = sse / Math.max(1, X.length - k);
	const XtX = Array.from({ length: k }, () => Array(k).fill(0));
	for (const row of X) for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) XtX[i][j] += row[i] * row[j];
	const e = Array(k).fill(0);
	e[1] = 1;
	const invCol = solveLocal(XtX, e);
	const se = invCol ? Math.sqrt(Math.max(1e-12, s2 * invCol[1])) : 1;
	return {
		tstat: b[1] / se,
		gamma: b[1]
	};
}
function solveLocal(A, b) {
	const n = b.length;
	const M = A.map((row, i) => [...row, b[i]]);
	for (let i = 0; i < n; i++) {
		let piv = i;
		for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
		if (Math.abs(M[piv][i]) < 1e-12) return null;
		[M[i], M[piv]] = [M[piv], M[i]];
		const d = M[i][i];
		for (let c = i; c <= n; c++) M[i][c] /= d;
		for (let r = 0; r < n; r++) {
			if (r === i) continue;
			const f = M[r][i];
			for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
		}
	}
	return M.map((row) => row[n]);
}
function adf(y, trend = false) {
	const { tstat } = olsSimple(y, trend);
	const crit = trend ? -3.41 : -2.86;
	return {
		tstat,
		crit,
		rejectUnitRoot: tstat < crit,
		label: trend ? "ADF (const + trend)" : "ADF (const)"
	};
}
function kpss(y, trend = false) {
	const n = y.length;
	const t = Array.from({ length: n }, (_, i) => i);
	let e;
	if (trend) {
		const b = ridgeFit(t.map((ti) => [1, ti]), y, 0) ?? [mean(y), 0];
		e = y.map((v, i) => v - (b[0] + b[1] * i));
	} else {
		const m = mean(y);
		e = y.map((v) => v - m);
	}
	let s = 0;
	let ss = 0;
	for (const v of e) {
		s += v;
		ss += s * s;
	}
	const sigma = e.reduce((a, v) => a + v * v, 0) / n || 1e-12;
	const eta = ss / (n * n * sigma);
	const crit = trend ? .146 : .463;
	return {
		eta,
		crit,
		rejectStationary: eta > crit,
		label: trend ? "KPSS (trend)" : "KPSS (level)"
	};
}
function stationarityCall(y) {
	const a = adf(y, false);
	const k = kpss(y, false);
	const at = adf(y, true);
	const kt = kpss(y, true);
	let call = "ambiguous";
	let why = "ADF failed to reject a unit root and KPSS failed to reject stationarity. The sample is under-powered. Look at the plot.";
	if (a.rejectUnitRoot && !k.rejectStationary) {
		call = "stationary";
		why = "ADF rejects a unit root and KPSS does not reject stationarity. Comfortably weakly stationary.";
	}
	if (!a.rejectUnitRoot && k.rejectStationary) {
		call = "unit root";
		why = "ADF cannot reject a unit root and KPSS rejects stationarity. Treat as I(1) and difference.";
	}
	if (!a.rejectUnitRoot && !k.rejectStationary) {
		call = "ambiguous";
		why = "Both tests are shy. Fail-to-reject is not proof. Look at the rolling mean, or get more data, or difference once and see if the ACF dies.";
	}
	if (a.rejectUnitRoot && k.rejectStationary) {
		call = "maybe trend / break";
		why = "Tests disagree in the other direction. Something else is wrong: a break, changing variance, leftover season, or you used the wrong deterministic terms.";
	}
	return {
		adf: a,
		kpss: k,
		adfTrend: at,
		kpssTrend: kt,
		call,
		why
	};
}
function difference(y, d) {
	let cur = y.slice();
	for (let k = 0; k < d; k++) {
		const n = [];
		for (let i = 1; i < cur.length; i++) n.push(cur[i] - cur[i - 1]);
		cur = n;
	}
	return cur;
}
function seasonalDiff(y, s) {
	const o = [];
	for (let i = s; i < y.length; i++) o.push(y[i] - y[i - s]);
	return o;
}
function boxCox(y, lam) {
	const mn = Math.min(...y);
	const shift = mn < .01 ? 1 - mn : 0;
	return y.map((v) => {
		const x = v + shift;
		if (Math.abs(lam) < 1e-6) return Math.log(Math.max(1e-8, x));
		return (Math.pow(Math.max(1e-8, x), lam) - 1) / lam;
	});
}
function linearDetrend(y) {
	const n = y.length;
	const coef = ridgeFit(Array.from({ length: n }, (_, i) => [1, i]), y, 0) ?? [mean(y), 0];
	const a = coef[0];
	const b = coef[1];
	const fitted = y.map((_, i) => a + b * i);
	return {
		resid: y.map((v, i) => v - fitted[i]),
		a,
		b,
		fitted
	};
}
function maDetrend(y, w) {
	const half = Math.floor(w / 2);
	const trend = y.map((_, t) => {
		const a = t - half;
		const b = t + half + 1;
		if (a < 0 || b > y.length) return null;
		return mean(y.slice(a, b));
	});
	return {
		resid: y.map((v, i) => trend[i] == null ? 0 : v - trend[i]),
		trend
	};
}
function rolling(y, w, fn) {
	return y.map((_, i) => {
		if (i + 1 < w) return null;
		return fn(y.slice(i + 1 - w, i + 1));
	});
}
function stdev(xs) {
	if (xs.length < 2) return 0;
	const m = mean(xs);
	return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
}
function halvesMoments(y) {
	const mid = Math.floor(y.length / 2);
	const a = y.slice(0, mid);
	const b = y.slice(mid);
	return {
		meanA: mean(a),
		meanB: mean(b),
		sdA: stdev(a),
		sdB: stdev(b)
	};
}
function finite(xs) {
	return xs.filter((v) => v != null && Number.isFinite(v));
}
function extent(series, pad = .08) {
	const all = series.flatMap((s) => finite(s.y));
	if (!all.length) return [-1, 1];
	let lo = Math.min(...all);
	let hi = Math.max(...all);
	if (lo === hi) {
		lo -= 1;
		hi += 1;
	}
	const span = hi - lo;
	return [lo - pad * span, hi + pad * span];
}
function LinePlot({ series, height = 220, splitAt, bandLo, bandHi, xLabel }) {
	const n = Math.max(1, ...series.map((s) => s.y.length), bandLo?.length ?? 0);
	const [lo, hi] = extent([...series, ...bandLo && bandHi ? [{
		name: "b",
		y: [...bandLo, ...bandHi]
	}] : []]);
	const w = 640;
	const h = height;
	const pl = 40;
	const pt = 12;
	const pb = 28;
	const iw = 588;
	const ih = h - pt - pb;
	const x = (i) => pl + i / Math.max(1, n - 1) * iw;
	const y = (v) => pt + (hi - v) / (hi - lo || 1) * ih;
	const path = (ys) => {
		let d = "";
		let drawing = false;
		ys.forEach((v, i) => {
			if (v == null || !Number.isFinite(v)) {
				drawing = false;
				return;
			}
			d += `${drawing ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
			drawing = true;
		});
		return d;
	};
	const ticks = 4;
	const yTicks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / ticks);
	let area = "";
	if (bandLo && bandHi) {
		const pts = [];
		const len = Math.min(bandLo.length, bandHi.length);
		for (let i = 0; i < len; i++) {
			const a = bandLo[i];
			const b = bandHi[i];
			if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
			pts.push({
				i,
				lo: a,
				hi: b
			});
		}
		if (pts.length > 1) area = `${pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.hi).toFixed(1)}`).join(" ")} ${[...pts].reverse().map((p) => `L${x(p.i).toFixed(1)},${y(p.lo).toFixed(1)}`).join(" ")} Z`;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${w} ${h}`,
			className: "h-auto w-full",
			role: "img",
			children: [
				yTicks.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: pl,
					x2: 628,
					y1: y(t),
					y2: y(t),
					stroke: "currentColor",
					className: "text-border",
					strokeWidth: "1"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: 34,
					y: y(t) + 3,
					textAnchor: "end",
					className: "fill-muted-foreground",
					fontSize: "9",
					fontFamily: "IBM Plex Mono, ui-monospace, monospace",
					children: Math.abs(t) >= 100 ? t.toFixed(0) : t.toFixed(1)
				})] }, i)),
				area ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: area,
					fill: "var(--color-chart-1)",
					opacity: "0.12"
				}) : null,
				splitAt != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: x(splitAt),
					x2: x(splitAt),
					y1: pt,
					y2: h - pb,
					stroke: "var(--color-warn)",
					strokeDasharray: "3 4",
					strokeWidth: "1.2"
				}) : null,
				series.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: path(s.y),
					fill: "none",
					stroke: s.color ?? `var(--color-chart-${i % 5 + 1})`,
					strokeWidth: s.width ?? 1.6,
					strokeDasharray: s.dashed ? "5 4" : void 0,
					strokeLinejoin: "round",
					strokeLinecap: "round"
				}, s.name + i)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: w / 2,
					y: h - 6,
					textAnchor: "middle",
					className: "fill-muted-foreground",
					fontSize: "10",
					children: xLabel ?? "time"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1 flex flex-wrap gap-3 px-1",
			children: [series.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-1.5 text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-block h-0.5 w-4",
					style: {
						background: s.color ?? `var(--color-chart-${i % 5 + 1})`,
						opacity: s.dashed ? .7 : 1
					}
				}), s.name]
			}, s.name)), splitAt != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-1.5 text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-px w-4 border-t border-dashed border-warn" }), "the cut"]
			}) : null]
		})]
	});
}
function AcfBars({ values, n, title, highlight }) {
	const b = band(n);
	const w = 640;
	const h = 160;
	const pl = 36;
	const pt = 14;
	const iw = 594;
	const ih = 124;
	const m = Math.max(1, values.length - 1);
	const x = (k) => pl + k / m * iw;
	const y = (v) => pt + (1 - v) / 2 * ih;
	const zero = y(0);
	const barW = Math.max(2, iw / m * .55);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "h-auto w-full",
		role: "img",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: pl,
				x2: 630,
				y1: zero,
				y2: zero,
				stroke: "currentColor",
				className: "text-border"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: pl,
				x2: 630,
				y1: y(b),
				y2: y(b),
				stroke: "var(--color-destructive)",
				strokeDasharray: "3 3",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: pl,
				x2: 630,
				y1: y(-b),
				y2: y(-b),
				stroke: "var(--color-destructive)",
				strokeDasharray: "3 3",
				strokeWidth: "1"
			}),
			values.map((v, k) => {
				if (k === 0) return null;
				const hi = highlight?.includes(k);
				const yy = y(v);
				const bh = Math.abs(yy - zero);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: x(k) - barW / 2,
					y: Math.min(yy, zero),
					width: barW,
					height: Math.max(1, bh),
					fill: hi ? "var(--color-warn)" : "var(--color-chart-1)",
					opacity: Math.abs(v) > b ? 1 : .45
				}, k);
			}),
			[
				0,
				Math.round(m / 2),
				m
			].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: x(k),
				y: 154,
				textAnchor: "middle",
				className: "fill-muted-foreground",
				fontSize: "9",
				fontFamily: "IBM Plex Mono, ui-monospace, monospace",
				children: k
			}, k))
		]
	})] });
}
function DecompGrid({ observed, trend, seasonal, resid }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-2",
		children: [
			{
				name: "Observed",
				y: observed,
				color: "var(--color-chart-1)"
			},
			{
				name: "Trend",
				y: trend,
				color: "var(--color-chart-4)"
			},
			{
				name: "Season",
				y: seasonal,
				color: "var(--color-chart-3)"
			},
			{
				name: "Residual",
				y: resid,
				color: "var(--color-chart-5)"
			}
		].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-lg border border-border/80 bg-background/40 px-2 py-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
				series: [{
					name: r.name,
					y: r.y,
					color: r.color
				}],
				height: 112
			})
		}, r.name))
	});
}
function MiniBars({ labels, values, highlight }) {
	const max = Math.max(1e-6, ...values.map(Math.abs));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-end gap-2 h-36",
		children: values.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 flex-1 flex-col items-center gap-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[10px] tabular-nums text-muted-foreground",
					children: v.toFixed(2)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-24 w-full items-end rounded-sm bg-secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("w-full rounded-sm", highlight === i ? "bg-primary" : "bg-chart-1"),
						style: { height: `${Math.abs(v) / max * 100}%` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] text-muted-foreground",
					children: labels[i]
				})
			]
		}, labels[i]))
	});
}
function Knob({ label, value, min, max, step = 1, onChange, hint, unit }) {
	const pct = (value - min) / (max - min || 1) * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-muted-foreground",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs tabular-nums text-foreground",
					children: [Number.isInteger(step) && step >= 1 ? value : value.toFixed(2), unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: [" ", unit]
					}) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				step,
				value,
				onChange: (e) => onChange(Number(e.target.value)),
				className: "w-full",
				style: { ["--pct"]: `${pct}%` },
				"aria-label": label
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-[11px] leading-snug text-muted-foreground",
				children: hint
			}) : null
		]
	});
}
function Segmented({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1 rounded-lg bg-secondary p-1",
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(o.id),
			className: cn("h-9 rounded-md px-3 text-xs font-medium transition-colors duration-150", value === o.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"),
			children: o.label
		}, o.id))
	});
}
function Formula({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "overflow-x-auto rounded-lg border border-border bg-secondary/60 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground",
		children
	});
}
function Verdict({ tone, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("rounded-xl border p-4", {
			good: "border-signal/40 bg-signal/10",
			bad: "border-destructive/40 bg-destructive/10",
			warn: "border-warn/40 bg-warn/10",
			info: "border-border bg-card"
		}[tone]),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: {
					good: "Suitable",
					bad: "Not suitable",
					warn: "Careful",
					info: "Read this"
				}[tone]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-1 font-display text-lg leading-snug",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground",
				children
			})
		]
	});
}
function Callout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground",
		children
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 rounded-lg border border-border bg-card px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-base tabular-nums text-foreground",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-muted-foreground",
				children: hint
			}) : null
		]
	});
}
function Panel({ title, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-xl border border-border bg-card p-4", className),
		children: [title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-3 font-display text-lg",
			children: title
		}) : null, children]
	});
}
function Table({ headers, rows, highlight }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[28rem] text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: "border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
				children: headers.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "px-2 py-2 font-medium",
					children: h
				}, h))
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: cn("border-b border-border/60", highlight === i && "bg-signal/10"),
				children: r.map((c, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: cn("px-2 py-2", j === 0 ? "text-foreground" : "font-mono tabular-nums"),
					children: c
				}, j))
			}, i)) })]
		})
	});
}
var EXAMPLES = [
	{
		id: "gdp",
		label: "Real GDP",
		why: "Slow drift. July is not the point — this July vs July five years ago is."
	},
	{
		id: "icecream",
		label: "Ice cream",
		why: "Calendar season. You can name the period before you model."
	},
	{
		id: "load",
		label: "Grid load",
		why: "A 24-hour evening peak. Season at a daily clock."
	},
	{
		id: "price",
		label: "Asset price",
		why: "A stacked shock. The level wanders; the change is closer to noise."
	},
	{
		id: "noise",
		label: "Measurement",
		why: "Already white. The best forecast of the next shock is 0."
	}
];
function ChIntro() {
	const [ex, setEx] = (0, import_react.useState)("icecream");
	const [n, setN] = (0, import_react.useState)(180);
	const [seed, setSeed] = (0, import_react.useState)(7);
	const [doShuffle, setDoShuffle] = (0, import_react.useState)(false);
	const [sigma, setSigma] = (0, import_react.useState)(1.4);
	const raw = (0, import_react.useMemo)(() => {
		if (ex === "gdp") return simulate("trend", n, seed, {
			level: 40,
			slope: .18,
			sigma
		});
		if (ex === "icecream") return simulate("multi", n, seed, {
			level: 30,
			slope: .12,
			seasonAmp: 6,
			period: 12,
			sigma
		});
		if (ex === "load") return simulate("season", n, seed, {
			level: 50,
			slope: .02,
			seasonAmp: 12,
			period: 24,
			sigma: sigma * .6
		});
		if (ex === "price") return simulate("rw", n, seed, { sigma: sigma * .8 });
		return simulate("white", n, seed, { sigma });
	}, [
		ex,
		n,
		seed,
		sigma
	]);
	const y = (0, import_react.useMemo)(() => doShuffle ? shuffle(raw, seed + 3) : raw, [
		doShuffle,
		raw,
		seed
	]);
	const r = (0, import_react.useMemo)(() => acf(y, 24), [y]);
	const rRaw = (0, import_react.useMemo)(() => acf(raw, 24), [raw]);
	const lag1 = r[1] ?? 0;
	const lag1raw = rRaw[1] ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
					children: "1 · Object"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl",
					children: "A series is a number with a clock."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
					children: "Time series analysis is what you do when the order is the information. Shuffle the rows and you no longer have a series — you have a cross-section that forgot its past. The four jobs: describe the pieces, forecast a future the model was not allowed to see, monitor a break, explain a channel."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Formula, { children: [
					"y",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
					" is observed at date t. The cut is a date, never a random split."
				] })
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Pick a real shape, then break the clock",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						value: ex,
						onChange: setEx,
						options: EXAMPLES.map((e) => ({
							id: e.id,
							label: e.label
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: EXAMPLES.find((e) => e.id === ex)?.why
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [{
							name: doShuffle ? "shuffled" : "in time",
							y,
							color: "var(--color-chart-1)"
						}, ...doShuffle ? [{
							name: "true order",
							y: raw,
							color: "var(--color-chart-3)",
							dashed: true
						}] : []] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
							values: r,
							n: y.length,
							title: doShuffle ? "ACF of the shuffled series" : "ACF in time"
						}), doShuffle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
							values: rRaw,
							n: raw.length,
							title: "ACF of the true order"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "Key characteristics: ordered timestamps, possible unequal spacing, autocorrelation, a level that can drift, a season you can name from a calendar. Goals: description, forecast, control, monitoring. None of those survive a shuffled split." })]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Length n",
								value: n,
								min: 60,
								max: 360,
								step: 12,
								onChange: setN,
								hint: "Short series make every test shy."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Noise σ",
								value: sigma,
								min: .2,
								max: 4,
								step: .1,
								onChange: setSigma
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 40,
								step: 1,
								onChange: setSeed,
								hint: "A new draw of the same process."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Shuffle time", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: doShuffle,
									onChange: (e) => setDoShuffle(e.target.checked)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Mean",
							value: mean(y).toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Std",
							value: stdev(y).toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "ρ₁ now",
							value: lag1.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "ρ₁ true",
							value: lag1raw.toFixed(2)
						})
					]
				}),
				doShuffle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "You destroyed the object",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Lag-1 correlation fell from ",
						lag1raw.toFixed(2),
						" to ",
						lag1.toFixed(2),
						". Random cross-validation leaks the future into the past and then pretends the leftover is a test. For a series the cut is a date."
					] })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Keep the order",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Train on the earlier part, test on the later part. If you remember only one rule from this workshop: never shuffle time." })
				})
			]
		})]
	});
}
function ma(y, w) {
	const half = Math.floor(w / 2);
	return y.map((_, t) => {
		const a = t - half;
		const b = t + half + (w % 2 === 0 ? 0 : 1);
		if (a < 0 || b > y.length) return null;
		if (w % 2 === 0) return (mean(y.slice(t - half, t + half)) + mean(y.slice(t - half + 1, t + half + 1))) / 2;
		return mean(y.slice(a, b));
	});
}
function classicalDecompose(y, period, multiplicative) {
	const m = Math.max(2, period);
	const trend = ma(y, m);
	const monthSum = Array(m).fill(0);
	const monthN = Array(m).fill(0);
	for (let t = 0; t < y.length; t++) {
		if (trend[t] == null) continue;
		const tr = trend[t];
		const det = multiplicative ? y[t] / Math.max(1e-6, tr) : y[t] - tr;
		monthSum[t % m] += det;
		monthN[t % m] += 1;
	}
	const seas = monthSum.map((s, i) => monthN[i] ? s / monthN[i] : multiplicative ? 1 : 0);
	if (!multiplicative) {
		const sm = mean(seas);
		for (let i = 0; i < m; i++) seas[i] -= sm;
	} else {
		const sm = mean(seas) || 1;
		for (let i = 0; i < m; i++) seas[i] /= sm;
	}
	const seasonal = y.map((_, t) => seas[t % m]);
	return {
		observed: y,
		trend,
		seasonal,
		resid: y.map((v, t) => {
			if (trend[t] == null) return null;
			const tr = trend[t];
			return multiplicative ? v / Math.max(1e-6, tr * seasonal[t]) : v - tr - seasonal[t];
		})
	};
}
function loess(x, y, xout, span) {
	const n = x.length;
	const k = Math.max(4, Math.min(n, Math.round(span * n)));
	return xout.map((xq) => {
		const dist = x.map((xi) => Math.abs(xi - xq));
		const order = dist.map((_, i) => i).sort((a, b) => dist[a] - dist[b]);
		const h = dist[order[k - 1]] || 1e-6;
		let s0 = 0, s1 = 0, s2 = 0, t0 = 0, t1 = 0;
		for (let j = 0; j < k; j++) {
			const i = order[j];
			const u = Math.min(1, dist[i] / h);
			const w = (1 - u * u * u) ** 3;
			const xi = x[i] - xq;
			s0 += w;
			s1 += w * xi;
			s2 += w * xi * xi;
			t0 += w * y[i];
			t1 += w * xi * y[i];
		}
		const det = s0 * s2 - s1 * s1;
		if (Math.abs(det) < 1e-12) return t0 / (s0 || 1);
		return (t0 * s2 - t1 * s1) / det;
	});
}
function stlLite(y, period, seasonalSpan, trendSpan, robust) {
	const m = Math.max(2, period);
	const n = y.length;
	const idx = Array.from({ length: n }, (_, i) => i);
	let seasonal = Array(n).fill(0);
	let trend = Array(n).fill(mean(y));
	const w = Array(n).fill(1);
	for (let iter = 0; iter < (robust ? 4 : 2); iter++) {
		const detrend = y.map((v, i) => v - trend[i]);
		for (let k = 0; k < m; k++) {
			const xs = [];
			const ys = [];
			for (let t = k; t < n; t += m) {
				xs.push(t);
				ys.push(detrend[t] * w[t]);
			}
			if (xs.length < 3) continue;
			const fit = loess(xs, ys, xs, seasonalSpan);
			xs.forEach((t, j) => {
				seasonal[t] = fit[j];
			});
		}
		const sm = mean(seasonal);
		seasonal = seasonal.map((s) => s - sm);
		trend = loess(idx, y.map((v, i) => v - seasonal[i]), idx, trendSpan);
		if (robust) {
			const r = y.map((v, i) => v - trend[i] - seasonal[i]);
			const abs = r.map(Math.abs).sort((a, b) => a - b);
			const mad = (abs[Math.floor(abs.length / 2)] || 1) * 6 || 1;
			for (let i = 0; i < n; i++) {
				const u = Math.min(1, Math.abs(r[i]) / mad);
				w[i] = (1 - u * u) ** 2;
			}
		}
	}
	const resid = y.map((v, i) => v - trend[i] - seasonal[i]);
	return {
		observed: y,
		trend,
		seasonal,
		resid
	};
}
function leftoverSeason(resid, period) {
	const r = resid.filter((v) => v != null);
	if (r.length < period * 2) return 0;
	const m = period;
	const by = Array.from({ length: m }, () => []);
	resid.forEach((v, t) => {
		if (v != null) by[t % m].push(v);
	});
	return by.map((a) => a.length ? mean(a) : 0).reduce((s, x) => s + x * x, 0) / m / (r.reduce((s, x) => s + x * x, 0) / r.length || 1);
}
function ChDecomp() {
	const [n, setN] = (0, import_react.useState)(168);
	const [seed, setSeed] = (0, import_react.useState)(4);
	const [slope, setSlope] = (0, import_react.useState)(.14);
	const [amp, setAmp] = (0, import_react.useState)(8);
	const [period, setPeriod] = (0, import_react.useState)(12);
	const [cycleAmp, setCycleAmp] = (0, import_react.useState)(0);
	const [cycleLen, setCycleLen] = (0, import_react.useState)(48);
	const [sigma, setSigma] = (0, import_react.useState)(1.2);
	const [gen, setGen] = (0, import_react.useState)("add");
	const [model, setModel] = (0, import_react.useState)("add");
	const [showPieces, setShowPieces] = (0, import_react.useState)(false);
	const y = (0, import_react.useMemo)(() => {
		if (gen === "multi") return simulate("multi", n, seed, {
			level: 40,
			slope,
			seasonAmp: amp / 4,
			period,
			sigma,
			cycleAmp,
			cycleLen
		});
		return simulate("cycle", n, seed, {
			level: 80,
			slope,
			seasonAmp: amp,
			period,
			sigma,
			cycleAmp,
			cycleLen
		});
	}, [
		gen,
		n,
		seed,
		slope,
		amp,
		period,
		sigma,
		cycleAmp,
		cycleLen
	]);
	const pieces = (0, import_react.useMemo)(() => classicalDecompose(y, period, model === "multi"), [
		y,
		period,
		model
	]);
	const leak = leftoverSeason(pieces.resid, period);
	const mismatch = gen !== model;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "2 · Decomposition"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "The number you see is several things stacked."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "Decomposition is not a forecast. It is a way of seeing. After you can see the pieces, you decide whether Holt–Winters, SARIMA, a log, or a difference is the next tool."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Formula, { children: model === "add" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = Trend + Season + Cycle + Residual"
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = Trend × Season × Cycle × Residual"
					] }) })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Build a series, then take it apart",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Generate" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: gen,
								onChange: setGen,
								options: [{
									id: "add",
									label: "Additive world"
								}, {
									id: "multi",
									label: "Multiplicative world"
								}]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [{
							name: "observed",
							y,
							color: "var(--color-chart-1)"
						}, {
							name: "classical trend",
							y: pieces.trend,
							color: "var(--color-chart-4)",
							dashed: true
						}] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: showPieces,
								onChange: (e) => setShowPieces(e.target.checked)
							}), "Season vs cycle vs leftover (the four-panel)"]
						})
					]
				}),
				showPieces ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DecompGrid, {
					observed: y,
					trend: pieces.trend,
					seasonal: pieces.seasonal,
					resid: pieces.resid
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "Trend is the slow drift — this July versus July five years ago. Season is a pattern you can name from a calendar (12 months, 7 days, 24 hours). A cycle also rises and falls, but you cannot mark the date in advance. Residuals are not the unimportant part. They are how you know whether you are finished." })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Trend slope",
								value: slope,
								min: 0,
								max: .45,
								step: .01,
								onChange: setSlope,
								hint: "Trend is not the yearly July bump."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Season amplitude",
								value: amp,
								min: 0,
								max: 24,
								step: .5,
								onChange: setAmp
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Period m",
								value: period,
								min: 4,
								max: 24,
								step: 1,
								onChange: setPeriod,
								hint: "Known before you model. That is what makes it season."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Cycle amplitude",
								value: cycleAmp,
								min: 0,
								max: 18,
								step: .5,
								onChange: setCycleAmp,
								hint: "Business / credit cycle — length moves."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Cycle length",
								value: cycleLen,
								min: 24,
								max: 96,
								step: 4,
								onChange: setCycleLen
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Residual σ",
								value: sigma,
								min: .2,
								max: 5,
								step: .1,
								onChange: setSigma
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 40,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted-foreground",
								children: "Decomposition model"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: model,
								onChange: setModel,
								options: [{
									id: "add",
									label: "Additive"
								}, {
									id: "multi",
									label: "Multiplicative"
								}]
							})] })
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Leftover season",
					value: leak.toFixed(3),
					hint: "Share of residual variance that still has a calendar shape."
				}),
				mismatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: "bad",
					title: "Wrong flavour — season leaks",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"You generated a ",
						gen === "add" ? "constant-height" : "percent",
						" season and decomposed it as",
						" ",
						model === "add" ? "additive" : "multiplicative",
						". Classical season is forced to one height (or one ratio). The leftover yearly rhythm sits in the residual. Leftover-season score ",
						leak.toFixed(2),
						"."
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Fix: match the model to the waves, or take logs and then treat the result as additive." })]
				}) : leak > .12 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "The residual is unfinished",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Period, cycle, or noise is still structured. A cycle on a short monthly series looks like a slow bend in the trend — do not force a cycle component just because the slide lists the word." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Residual is close to unstructured",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Additive when the July bump is about +20 units every year. Multiplicative when July is about 25% above the local trend. Getting it wrong leaks season into the residual or into the trend." })
				})
			]
		})]
	});
}
function ChStl() {
	const [n, setN] = (0, import_react.useState)(180);
	const [seed, setSeed] = (0, import_react.useState)(9);
	const [period, setPeriod] = (0, import_react.useState)(12);
	const [slope, setSlope] = (0, import_react.useState)(.16);
	const [amp, setAmp] = (0, import_react.useState)(7);
	const [seasSpan, setSeasSpan] = (0, import_react.useState)(.4);
	const [trendSpan, setTrendSpan] = (0, import_react.useState)(.45);
	const [robust, setRobust] = (0, import_react.useState)(true);
	const [outlier, setOutlier] = (0, import_react.useState)(18);
	const [world, setWorld] = (0, import_react.useState)("growing");
	const [view, setView] = (0, import_react.useState)("obs");
	const raw = (0, import_react.useMemo)(() => {
		if (world === "stable") return simulate("season", n, seed, {
			level: 70,
			slope: .04,
			seasonAmp: amp,
			period,
			sigma: 1.1
		});
		if (world === "break") return injectOutlier(simulate("season", n, seed, {
			level: 60,
			slope: .08,
			seasonAmp: amp,
			period,
			sigma: 1.2
		}), Math.floor(n * .55), outlier);
		return simulate("multi", n, seed, {
			level: 35,
			slope,
			seasonAmp: amp / 3.5,
			period,
			sigma: 1.3
		});
	}, [
		world,
		n,
		seed,
		amp,
		period,
		slope,
		outlier
	]);
	const klass = (0, import_react.useMemo)(() => classicalDecompose(raw, period, false), [raw, period]);
	const stl = (0, import_react.useMemo)(() => stlLite(raw, period, seasSpan, trendSpan, robust), [
		raw,
		period,
		seasSpan,
		trendSpan,
		robust
	]);
	const leakC = leftoverSeason(klass.resid, period);
	const leakS = leftoverSeason(stl.resid, period);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "3 · STL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "LOESS twice, then whatever is left."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "A seasonal smoother at lag m (each January with other Januarys) and a trend smoother on the seasonally adjusted series. It iterates. Native STL is additive — for multiplicative data, decompose log y, then exponentiate. STL does not produce next year’s July. Holt–Winters and SARIMA do."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Formula, { children: "seasonal LOESS at lag m  →  trend LOESS  →  residual = leftover" })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Classical additive vs STL, same series",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: world,
							onChange: setWorld,
							options: [
								{
									id: "stable",
									label: "Stable season"
								},
								{
									id: "growing",
									label: "Growing waves"
								},
								{
									id: "break",
									label: "One lightning strike"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: view,
								onChange: setView,
								options: [
									{
										id: "obs",
										label: "Observed"
									},
									{
										id: "class",
										label: "Classical 4-panel"
									},
									{
										id: "stl",
										label: "STL 4-panel"
									}
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: view === "obs" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [
								{
									name: "observed",
									y: raw,
									color: "var(--color-chart-1)"
								},
								{
									name: "classical trend",
									y: klass.trend,
									color: "var(--color-destructive)",
									dashed: true
								},
								{
									name: "STL trend",
									y: stl.trend,
									color: "var(--color-chart-3)"
								}
							] }) : view === "class" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DecompGrid, {
								observed: raw,
								trend: klass.trend,
								seasonal: klass.seasonal,
								resid: klass.resid
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DecompGrid, {
								observed: raw,
								trend: stl.trend,
								seasonal: stl.seasonal,
								resid: stl.resid
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "How they differ",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: [
							"",
							"Classical",
							"STL"
						],
						rows: [
							[
								"Trend",
								"Moving average, fixed width",
								"LOESS — can bend"
							],
							[
								"Season",
								"Forced almost constant",
								"Allowed to evolve slowly"
							],
							[
								"Flavour",
								"You pick add / multi",
								"Additive; log for multi"
							],
							[
								"Outliers",
								"Distort T and S",
								"Robust weights isolate them"
							],
							[
								"Forecast?",
								"Not the goal",
								"Not the goal either"
							]
						]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Period m",
								value: period,
								min: 4,
								max: 24,
								step: 1,
								onChange: setPeriod
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seasonal span",
								value: seasSpan,
								min: .15,
								max: .9,
								step: .05,
								onChange: setSeasSpan,
								hint: "Small = season may evolve. Large = almost classical."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Trend span",
								value: trendSpan,
								min: .2,
								max: .9,
								step: .05,
								onChange: setTrendSpan,
								hint: "Small = wiggly trend. Large = stiff."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Slope (growing world)",
								value: slope,
								min: 0,
								max: .4,
								step: .01,
								onChange: setSlope
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Season amp",
								value: amp,
								min: 0,
								max: 16,
								step: .5,
								onChange: setAmp
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Outlier size",
								value: outlier,
								min: 0,
								max: 40,
								step: 1,
								onChange: setOutlier,
								hint: "Only used in the lightning-strike world."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 96,
								max: 240,
								step: 12,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Robust weights", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: robust,
									onChange: (e) => setRobust(e.target.checked)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Classical leak",
						value: leakC.toFixed(2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "STL leak",
						value: leakS.toFixed(2)
					})]
				}),
				world === "growing" && leakC > leakS + .04 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Classical additive is the wrong tool here",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Waves grow with the level. Classical additive forces one seasonal height, so leftover structure leaks (score ",
						leakC.toFixed(2),
						" vs STL ",
						leakS.toFixed(2),
						"). Take logs, or use multiplicative classical, or let STL’s seasonal smoother evolve."
					] })
				}) : world === "break" && !robust ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "The strike is being swallowed",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A jump is an intervention, not noise. Without robust weights the trend kinks to eat it. Turn robust on and the spike should sit in the residual." })
				}) : world === "stable" && leakC < .08 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Classical is enough",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Season looks stable and additive. STL is not mandatory. If you only need a quick picture, seasonal decompose is fine. If you need a forecast, do not stop at either method." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: "info",
					title: "Default ladder, not a religion",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Plot. Waves grow → log or multiplicative." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Stable season, quick picture → classical." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Changing season, outliers, bent trend → STL robust." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Need next July → Holt–Winters or SARIMA." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "Two calendars at once (hour-of-day and day-of-week) want MSTL, TBATS, or two sets of Fourier terms. One STL call still has one period." })
			]
		})]
	});
}
function ChStationarity() {
	const [world, setWorld] = (0, import_react.useState)("rw");
	const [n, setN] = (0, import_react.useState)(200);
	const [seed, setSeed] = (0, import_react.useState)(5);
	const [phi, setPhi] = (0, import_react.useState)(.7);
	const [d, setD] = (0, import_react.useState)(0);
	const [Ds, setDs] = (0, import_react.useState)(0);
	const [lam, setLam] = (0, import_react.useState)(1);
	const [detrend, setDetrend] = (0, import_react.useState)("none");
	const [win, setWin] = (0, import_react.useState)(20);
	const [period, setPeriod] = (0, import_react.useState)(12);
	const [trendTerm, setTrendTerm] = (0, import_react.useState)(false);
	const raw = (0, import_react.useMemo)(() => {
		if (world === "white") return simulate("white", n, seed, { sigma: 1 });
		if (world === "ar") return simulate("ar1", n, seed, {
			phi,
			sigma: 1
		});
		if (world === "rw") return simulate("rw", n, seed, { sigma: 1 });
		if (world === "trend") return simulate("trend", n, seed, {
			level: 10,
			slope: .12,
			sigma: 1
		});
		if (world === "multi") return simulate("multi", n, seed, {
			level: 20,
			slope: .12,
			seasonAmp: 5,
			period,
			sigma: 1.2
		});
		const once = simulate("rwdrift", n, seed, {
			drift: .04,
			sigma: .7
		});
		const out = [20];
		for (let t = 1; t < n; t++) out.push(out[t - 1] + once[t] * .15);
		return out;
	}, [
		world,
		n,
		seed,
		phi,
		period
	]);
	const repaired = (0, import_react.useMemo)(() => {
		let z = raw.slice();
		if (lam !== 1) z = boxCox(z, lam);
		if (detrend === "linear") z = linearDetrend(z).resid;
		if (detrend === "ma") z = maDetrend(z, win).resid;
		if (d > 0) z = difference(z, d);
		if (Ds > 0) z = seasonalDiff(z, period);
		return z;
	}, [
		raw,
		lam,
		detrend,
		win,
		d,
		Ds,
		period
	]);
	const testsRaw = (0, import_react.useMemo)(() => stationarityCall(raw), [raw]);
	const tests = (0, import_react.useMemo)(() => stationarityCall(repaired), [repaired]);
	const adfUse = trendTerm ? tests.adfTrend : tests.adf;
	const kpssUse = trendTerm ? tests.kpssTrend : tests.kpss;
	const rMean = rolling(repaired, Math.max(8, Math.floor(repaired.length / 10)), mean);
	const rSd = rolling(repaired, Math.max(8, Math.floor(repaired.length / 10)), stdev);
	const r = acf(repaired, 24);
	const h = halvesMoments(repaired);
	const overDiff = world === "white" && d >= 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "4 · Stationarity"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "Same rules in 2021 as in 2015."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "A model estimated on one window is asked to speak about another. That only works if mean, variance, and lag-k correlation do not depend on the date. Weak (covariance) stationarity is what ARMA assumes. Strict stationarity is almost never testable. ARIMA’s “I” is: change the series until the assumption is plausible."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Formula, { children: [
						"E(y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						")=μ · Var(y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						")=σ² · Cov(y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						", y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t−k" }),
						")=γ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "k" })
					] })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "World, then repair",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: world,
							onChange: setWorld,
							options: [
								{
									id: "white",
									label: "White"
								},
								{
									id: "ar",
									label: "AR(1)"
								},
								{
									id: "rw",
									label: "Random walk"
								},
								{
									id: "trend",
									label: "Line + noise"
								},
								{
									id: "multi",
									label: "Growing season"
								},
								{
									id: "i2",
									label: "I(2)"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [
								{
									name: "repaired series",
									y: repaired,
									color: "var(--color-chart-1)"
								},
								{
									name: "rolling mean",
									y: rMean,
									color: "var(--color-chart-4)",
									dashed: true
								},
								{
									name: "rolling std",
									y: rSd,
									color: "var(--color-chart-3)",
									dashed: true
								}
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
								values: r,
								n: repaired.length,
								title: "ACF after the repair"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "ADF and KPSS disagree on purpose",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: [
							"Test",
							"Null",
							"Statistic",
							"5% crit",
							"Decision"
						],
						rows: [[
							adfUse.label,
							"unit root",
							adfUse.tstat.toFixed(2),
							String(adfUse.crit),
							adfUse.rejectUnitRoot ? "reject H0 → stationary-ish" : "fail to reject unit root"
						], [
							kpssUse.label,
							"stationary",
							kpssUse.eta.toFixed(3),
							String(kpssUse.crit),
							kpssUse.rejectStationary ? "reject H0 → not stationary" : "fail to reject stationary"
						]]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: trendTerm,
							onChange: (e) => setTrendTerm(e.target.checked)
						}), "Run tests with a trend term (use this when the plot climbs)"]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Repair knobs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "φ (AR world)",
								value: phi,
								min: -.95,
								max: 1.05,
								step: .05,
								onChange: setPhi,
								hint: "|φ|<1 mean-reverts. φ=1 is a random walk. |φ|>1 explodes."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Box–Cox λ",
								value: lam,
								min: -.5,
								max: 1.5,
								step: .1,
								onChange: setLam,
								hint: "1 = do nothing. 0 = log. Attacks variance, not a unit root."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted-foreground",
								children: "De-trend"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: detrend,
								onChange: setDetrend,
								options: [
									{
										id: "none",
										label: "None"
									},
									{
										id: "linear",
										label: "Linear"
									},
									{
										id: "ma",
										label: "Moving avg"
									}
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "MA window",
								value: win,
								min: 6,
								max: 48,
								step: 2,
								onChange: setWin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Differences d",
								value: d,
								min: 0,
								max: 2,
								step: 1,
								onChange: setD,
								hint: "d=2 is for a wandering slope. d>2 is usually a log or a break."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seasonal D",
								value: Ds,
								min: 0,
								max: 1,
								step: 1,
								onChange: setDs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Period m",
								value: period,
								min: 4,
								max: 24,
								step: 1,
								onChange: setPeriod
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 360,
								step: 10,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Half-A mean",
							value: h.meanA.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Half-B mean",
							value: h.meanB.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Half-A sd",
							value: h.sdA.toFixed(2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Half-B sd",
							value: h.sdB.toFixed(2)
						})
					]
				}),
				overDiff ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Over-differenced",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The raw world was already stationary. Differencing “to be safe” manufactures MA structure and throws away the level. Stop as soon as rolling mean/std hold and ACF dies quickly." })
				}) : world === "trend" && d >= 1 && detrend === "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "A line is not a random walk",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Differencing a deterministic trend works (Δ(a+bt)=b) but is blunt — it creates MA structure you then model. If you know the trend is a straight line, subtract the line. ADF with a trend term is how you ask which world you are in." })
				}) : world === "multi" && lam === 1 && d === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "Variance is climbing with the level",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Log or Box–Cox first. A transform does not remove a unit root by itself. You often log, then difference. If you intend to forecast the season, keep it for SARIMA / Holt–Winters instead of throwing it away." })
				}) : tests.call === "stationary" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: "good",
					title: "Allowed into ARMA",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tests.why }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Then, and only then, read ACF/PACF for p and q." })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: tests.call === "unit root" ? "bad" : "warn",
					title: tests.call,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tests.why }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Raw-series reading (no repair): ",
						testsRaw.call,
						"."
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "Fail-to-reject ADF is not proof of a unit root. φ = 0.97 looks a lot like φ = 1. Always pair the test with the plot." })
			]
		})]
	});
}
function ChNoise() {
	const [kind, setKind] = (0, import_react.useState)("white");
	const [n, setN] = (0, import_react.useState)(240);
	const [seed, setSeed] = (0, import_react.useState)(11);
	const [sigma, setSigma] = (0, import_react.useState)(1);
	const [phi, setPhi] = (0, import_react.useState)(.5);
	const [drift, setDrift] = (0, import_react.useState)(.08);
	const [diffOnce, setDiffOnce] = (0, import_react.useState)(false);
	const [h, setH] = (0, import_react.useState)(40);
	const raw = (0, import_react.useMemo)(() => {
		if (kind === "white") return simulate("white", n, seed, { sigma });
		if (kind === "rw") return simulate("rw", n, seed, { sigma });
		if (kind === "rwdrift") return simulate("rwdrift", n, seed, {
			sigma,
			drift
		});
		return simulate("ar1", n, seed, {
			phi,
			sigma
		});
	}, [
		kind,
		n,
		seed,
		sigma,
		phi,
		drift
	]);
	const y = diffOnce ? difference(raw, 1) : raw;
	const r = acf(y, 24);
	const p = pacf(y, 16);
	const lb = ljungBox(y, 12);
	const tests = stationarityCall(y);
	const last = raw[raw.length - 1] ?? 0;
	const fc = Array.from({ length: n + h }, (_, i) => i < n ? null : kind === "white" ? 0 : last + (kind === "rwdrift" ? drift * (i - n + 1) : 0));
	const lo = fc.map((v, i) => v == null ? null : v - 1.96 * sigma * Math.sqrt(kind === "white" ? 1 : i - n + 1));
	const hi = fc.map((v, i) => v == null ? null : v + 1.96 * sigma * Math.sqrt(kind === "white" ? 1 : i - n + 1));
	const shown = raw.concat(Array(h).fill(null));
	const isWN = kind === "white" || diffOnce && kind !== "ar";
	const isRW = kind === "rw" || kind === "rwdrift";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "5 · White noise and random walk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "The same shocks, stacked or not."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: [
							"Every later model is “what we observe = something the model can explain + ε",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
							"”. ε",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
							" is supposed to be white noise. If the leftover is not, the model is unfinished. A random walk is those shocks added up. That is why a random walk is ARIMA(0,1,0)."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Formula, { children: kind === "white" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" })
					] }) : kind === "rw" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t−1" }),
						" + ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" })
					] }) : kind === "rwdrift" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = μ + y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t−1" }),
						" + ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" })
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = φ y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t−1" }),
						" + ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" })
					] }) })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Four views, never one number",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: kind,
							onChange: setKind,
							options: [
								{
									id: "white",
									label: "White noise"
								},
								{
									id: "ar",
									label: "AR(1) φ"
								},
								{
									id: "rw",
									label: "Random walk"
								},
								{
									id: "rwdrift",
									label: "Walk + drift"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
								series: [{
									name: "observed",
									y: shown,
									color: "var(--color-chart-1)"
								}, {
									name: "point forecast",
									y: fc,
									color: "var(--color-chart-4)",
									dashed: true
								}],
								splitAt: n - 1,
								bandLo: lo,
								bandHi: hi
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
								values: r,
								n: y.length,
								title: diffOnce ? "ACF of Δy" : "ACF"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
								values: p,
								n: y.length,
								title: "PACF"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "The identity that justifies differencing",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: [
							"",
							"White noise",
							"Random walk"
						],
						rows: [
							[
								"Stationary?",
								"Yes",
								"No — Var(y_t)=t σ²"
							],
							[
								"ACF",
								"Dead after 0",
								"Slow slide from 1"
							],
							[
								"Best forecast",
								"The mean (usually 0)",
								"Last value (plus μh if drift)"
							],
							[
								"Long horizon",
								"Nothing useful",
								"Point stays; interval grows like √h"
							]
						]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "σ",
								value: sigma,
								min: .3,
								max: 3,
								step: .1,
								onChange: setSigma
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "φ (AR world)",
								value: phi,
								min: 0,
								max: 1.05,
								step: .05,
								onChange: setPhi,
								hint: "0.5 forgets. 0.9 is sticky. 1.0 has no home."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Drift μ",
								value: drift,
								min: 0,
								max: .3,
								step: .01,
								onChange: setDrift
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 400,
								step: 10,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Forecast h",
								value: h,
								min: 10,
								max: 80,
								step: 5,
								onChange: setH
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 40,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Difference once", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: diffOnce,
									onChange: (e) => setDiffOnce(e.target.checked)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Ljung–Box Q",
							value: lb.q.toFixed(1)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "p-value",
							value: lb.p.toFixed(3),
							hint: lb.p < .05 ? "still correlated" : "compatible with WN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "ADF/KPSS",
							value: tests.call
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "ρ₁",
							value: (r[1] ?? 0).toFixed(2)
						})
					]
				}),
				isRW && !diffOnce ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Do not fit AR(20)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Nearby values share almost the same pile of past shocks, so they are extremely correlated. Difference once: Δy",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						". You did not invent a clever model. You took the extra memory out by subtracting yesterday."
					] })
				}) : isWN ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Unforecastable from its own past",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Best forecast of ε",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t+1" }),
						" is 0. Raw data already white → stop. ARIMA residuals white → the univariate structure is finished. Ljung–Box p = ",
						lb.p.toFixed(3),
						"."
					] })
				}) : kind === "ar" && phi >= .95 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "The boundary of AR(1)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "|φ| < 1 pulled back to a mean. φ = 1 the pullback dies. You are standing on that step. ADF has low power here on purpose." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "info",
					title: "Mean-reverting, still stationary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Today keeps ",
						Math.round(phi * 100),
						"% of yesterday’s deviation, then adds noise. There is momentum, but there is still a long-run mean. This is the process ARIMA is allowed to eat without differencing."
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "One realised path of a driftless random walk looks like a story. Across imaginary worlds the mean stays at 0. Students mix those two things up because they only ever see one path." })
			]
		})]
	});
}
function mae(actual, pred) {
	const n = Math.min(actual.length, pred.length);
	if (!n) return 0;
	let s = 0;
	for (let i = 0; i < n; i++) s += Math.abs(actual[i] - pred[i]);
	return s / n;
}
function mse(actual, pred) {
	const n = Math.min(actual.length, pred.length);
	if (!n) return 0;
	let s = 0;
	for (let i = 0; i < n; i++) {
		const e = actual[i] - pred[i];
		s += e * e;
	}
	return s / n;
}
function rmse(actual, pred) {
	return Math.sqrt(mse(actual, pred));
}
function mape(actual, pred) {
	const n = Math.min(actual.length, pred.length);
	if (!n) return null;
	let s = 0;
	let k = 0;
	for (let i = 0; i < n; i++) {
		if (Math.abs(actual[i]) < 1e-8) return null;
		s += Math.abs(actual[i] - pred[i]) / Math.abs(actual[i]);
		k++;
	}
	return k ? 100 * s / k : null;
}
function smape(actual, pred) {
	const n = Math.min(actual.length, pred.length);
	if (!n) return 0;
	let s = 0;
	for (let i = 0; i < n; i++) {
		const den = Math.abs(actual[i]) + Math.abs(pred[i]);
		s += den < 1e-12 ? 0 : 2 * Math.abs(actual[i] - pred[i]) / den;
	}
	return 100 * s / n;
}
function mase(actual, pred, season = 1) {
	if (Math.min(actual.length, pred.length) < 2) return 0;
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
function aicFromResid(resid, k) {
	const n = resid.length;
	const sse = resid.reduce((s, e) => s + e * e, 0);
	const sig2 = sse / Math.max(1, n);
	const nll = n / 2 * (Math.log(2 * Math.PI) + Math.log(Math.max(1e-12, sig2)) + 1);
	const aic = 2 * nll + 2 * k;
	return {
		aic,
		bic: 2 * nll + k * Math.log(Math.max(2, n)),
		aicc: aic + 2 * k * (k + 1) / Math.max(1, n - k - 1),
		sse,
		sig2,
		n,
		k
	};
}
function yuleWalker(y, p) {
	if (p <= 0) return [];
	const r = acf(y, p);
	const R = Array.from({ length: p }, () => Array(p).fill(0));
	const rhs = Array(p).fill(0);
	for (let i = 0; i < p; i++) {
		rhs[i] = r[i + 1];
		for (let j = 0; j < p; j++) R[i][j] = r[Math.abs(i - j)];
	}
	return ridgeFit(R, rhs, 1e-6) ?? Array(p).fill(0);
}
function longARResid(y, pLong) {
	const phi = yuleWalker(y, pLong);
	const m = mean(y);
	const e = Array(y.length).fill(0);
	for (let t = 0; t < y.length; t++) {
		let yh = m;
		for (let i = 1; i <= pLong; i++) yh += (phi[i - 1] ?? 0) * ((y[t - i] ?? m) - m);
		e[t] = y[t] - yh;
	}
	return e;
}
function at(arr, t, fill = 0) {
	return t >= 0 && t < arr.length ? arr[t] : fill;
}
function fitARMA(y, p, q, P = 0, Q = 0, m = 12) {
	const n = y.length;
	const pLong = Math.min(Math.max(p + q + (P + Q) * Math.max(1, m) + 4, 6), Math.floor(n / 4) || 1);
	let e = longARResid(y, Math.max(1, pLong));
	const rows = [];
	const yy = [];
	const start = Math.max(p, q, P * m, Q * m, pLong, 1);
	for (let t = start; t < n; t++) {
		const row = [1];
		for (let i = 1; i <= p; i++) row.push(at(y, t - i));
		for (let i = 1; i <= P; i++) row.push(at(y, t - i * m));
		for (let j = 1; j <= q; j++) row.push(at(e, t - j));
		for (let j = 1; j <= Q; j++) row.push(at(e, t - j * m));
		rows.push(row);
		yy.push(y[t]);
	}
	const k = 1 + p + P + q + Q;
	const b = ridgeFit(rows, yy, 4e-4) ?? [mean(y), ...Array(Math.max(0, k - 1)).fill(0)];
	const c = b[0] ?? 0;
	let off = 1;
	const phi = b.slice(off, off + p);
	off += p;
	const Phi = b.slice(off, off + P);
	off += P;
	const theta = b.slice(off, off + q);
	off += q;
	const Theta = b.slice(off, off + Q);
	const fitted = [];
	const resid = [];
	for (let t = 0; t < n; t++) {
		let yh = c;
		for (let i = 1; i <= p; i++) yh += (phi[i - 1] ?? 0) * at(y, t - i, c);
		for (let i = 1; i <= P; i++) yh += (Phi[i - 1] ?? 0) * at(y, t - i * m, c);
		for (let j = 1; j <= q; j++) yh += (theta[j - 1] ?? 0) * at(resid, t - j);
		for (let j = 1; j <= Q; j++) yh += (Theta[j - 1] ?? 0) * at(resid, t - j * m);
		fitted.push(yh);
		resid.push(y[t] - yh);
	}
	const info = aicFromResid(resid.slice(Math.max(start, 1)), Math.max(1, k));
	return {
		phi,
		theta,
		Phi,
		Theta,
		c,
		resid,
		fitted,
		aic: info.aic,
		bic: info.bic,
		aicc: info.aicc,
		k
	};
}
function undifference(last, dY) {
	const out = [];
	let prev = last[last.length - 1] ?? 0;
	if (last.length === 2) {
		let a = last[0];
		let b = last[1];
		for (const z of dY) {
			const nxt = 2 * b - a + z;
			out.push(nxt);
			a = b;
			b = nxt;
		}
		return out;
	}
	for (const z of dY) {
		prev = prev + z;
		out.push(prev);
	}
	return out;
}
function undifferenceSeasonal(history, m, diffs) {
	const h = history.slice();
	const out = [];
	for (const z of diffs) {
		const nxt = (h[h.length - m] ?? h[h.length - 1] ?? 0) + z;
		h.push(nxt);
		out.push(nxt);
	}
	return out;
}
function oneStepBack(y, d, D, m, zFitted) {
	const n = y.length;
	const orig = y.slice();
	const start = d + D * Math.max(1, m);
	if (D <= 0 && d <= 0) {
		for (let t = 0; t < Math.min(n, zFitted.length); t++) orig[t] = zFitted[t];
		return orig;
	}
	if (D <= 0 && d === 1) {
		orig[0] = y[0];
		for (let t = 1; t < n; t++) orig[t] = y[t - 1] + (zFitted[t - 1] ?? 0);
		return orig;
	}
	if (D <= 0 && d >= 2) {
		orig[0] = y[0];
		orig[1] = y[1] ?? y[0];
		for (let t = 2; t < n; t++) orig[t] = 2 * y[t - 1] - y[t - 2] + (zFitted[t - 2] ?? 0);
		return orig;
	}
	for (let t = 0; t < n; t++) {
		if (t < start) {
			orig[t] = y[t];
			continue;
		}
		const zHat = zFitted[t - start] ?? 0;
		if (d === 0) orig[t] = y[t - m] + zHat;
		else if (d === 1) orig[t] = y[t - 1] + y[t - m] - (y[t - m - 1] ?? y[t - m]) + zHat;
		else orig[t] = y[t - 1] + y[t - m] - (y[t - m - 1] ?? y[t - m]) + zHat;
	}
	return orig;
}
function fitARIMA(y, p, d, q) {
	return fitSARIMA(y, p, d, q, 0, 0, 0, 12);
}
function fitSARIMA(y, p, d, q, P, D, Q, m) {
	let z = y.slice();
	if (D > 0 && m > 1) z = seasonalDiff(z, m);
	z = difference(z, d);
	const fit = fitARMA(z, p, q, P, Q, m);
	const origFitted = oneStepBack(y, d, D, m, fit.fitted);
	return {
		...fit,
		d,
		D,
		m,
		origFitted
	};
}
function forecastDifferenced(z, fit, p, q, P, Q, m, h) {
	const zHist = z.slice();
	const eHist = fit.resid.slice();
	const zFc = [];
	for (let k = 0; k < h; k++) {
		let yh = fit.c;
		for (let i = 1; i <= p; i++) yh += (fit.phi[i - 1] ?? 0) * at(zHist, zHist.length - i);
		for (let i = 1; i <= P; i++) yh += (fit.Phi[i - 1] ?? 0) * at(zHist, zHist.length - i * m);
		for (let j = 1; j <= q; j++) yh += (fit.theta[j - 1] ?? 0) * at(eHist, eHist.length - j);
		for (let j = 1; j <= Q; j++) yh += (fit.Theta[j - 1] ?? 0) * at(eHist, eHist.length - j * m);
		zFc.push(yh);
		zHist.push(yh);
		eHist.push(0);
	}
	return zFc;
}
function forecastARIMA(y, p, d, q, h) {
	return forecastSARIMA(y, p, d, q, 0, 0, 0, 12, h);
}
function forecastSARIMA(y, p, d, q, P, D, Q, m, h) {
	const fit = fitSARIMA(y, p, d, q, P, D, Q, m);
	let z = y.slice();
	if (D > 0 && m > 1) z = seasonalDiff(z, m);
	const afterSeason = z.slice();
	z = difference(z, d);
	const zFc = forecastDifferenced(z, fit, p, q, P, Q, m, h);
	let mid;
	if (d === 0) mid = zFc;
	else if (d === 1) mid = undifference([afterSeason[afterSeason.length - 1] ?? 0], zFc);
	else mid = undifference([afterSeason[afterSeason.length - 2] ?? 0, afterSeason[afterSeason.length - 1] ?? 0], zFc);
	return {
		fit,
		fc: D > 0 && m > 1 ? undifferenceSeasonal(y, m, mid) : mid
	};
}
function gridARIMA(y, d, pMax = 2, qMax = 2) {
	const rows = [];
	for (let p = 0; p <= pMax; p++) for (let q = 0; q <= qMax; q++) {
		const f = fitARIMA(y, p, d, q);
		rows.push({
			p,
			d,
			q,
			aic: f.aic,
			bic: f.bic
		});
	}
	rows.sort((a, b) => a.aic - b.aic);
	return rows;
}
function invertMA1(theta) {
	return Math.abs(theta) < 1;
}
function stationaryAR1(phi) {
	return Math.abs(phi) < 1;
}
function lastSignificant(vals, b, from = 1) {
	let last = 0;
	for (let k = from; k < vals.length; k++) if (Math.abs(vals[k]) > b) last = k;
	return last;
}
function firstCutoff(vals, b, from = 1) {
	for (let k = from; k < vals.length; k++) {
		if (Math.abs(vals[k]) > b) continue;
		let quiet = true;
		for (let j = k; j < Math.min(vals.length, k + 3); j++) if (Math.abs(vals[j]) > b) quiet = false;
		if (quiet) return k - 1;
	}
	return lastSignificant(vals, b, from);
}
function tailsOff(vals, b) {
	const cut = firstCutoff(vals, b);
	const last = lastSignificant(vals, b);
	return last - cut >= 3 || cut >= 4 && last >= 6;
}
function identify(y, maxLag = 24, period = 12) {
	const r = acf(y, maxLag);
	const p = pacf(y, Math.min(maxLag, 18));
	const b = band(y.length);
	const acfCut = firstCutoff(r, b);
	const pacfCut = firstCutoff(p, b);
	const slowDecay = r.slice(1, 8).every((v) => v > .35);
	let seasonalLag = null;
	if (period > 1 && r.length > period) {
		if (Math.abs(r[period] ?? 0) > b * 1.1) seasonalLag = period;
	}
	let suggest = "white noise";
	let why = "ACF and PACF are quiet after lag 0. Forecast the mean and stop.";
	let suitable = true;
	let dHint = 0;
	if (slowDecay) {
		suggest = "difference first — do not read p, q yet";
		why = "ACF slides down from 1. That is a wandering level, not an AR(20). Take Δy, then read the plots again. This is d = 1.";
		suitable = false;
		dHint = 1;
	} else if (acfCut <= 0 && pacfCut <= 0) {
		suggest = "white noise · ARIMA(0,0,0)";
		why = "No leftover linear memory. A fancy model will just fit noise.";
	} else if (pacfCut >= 1 && pacfCut <= 3 && (acfCut > pacfCut || tailsOff(r, b))) {
		suggest = `AR(${pacfCut})`;
		why = `PACF cuts off after lag ${pacfCut}; ACF tails off. Once the last ${pacfCut} values are in the model, further lags add nothing.`;
	} else if (acfCut >= 1 && acfCut <= 3 && (pacfCut > acfCut || tailsOff(p, b))) {
		suggest = `MA(${acfCut})`;
		why = `ACF cuts off after lag ${acfCut}; PACF tails off. A shock spills ${acfCut} period${acfCut > 1 ? "s" : ""} and then dies.`;
	} else {
		suggest = "ARMA(p, q) — search small mixed orders";
		why = "Both plots tail off. There is no cliff. Fit a few small (p, q), keep the one with white-noise residuals and the smallest AIC.";
	}
	if (seasonalLag && !slowDecay) {
		suggest += ` · seasonal lag ${seasonalLag}`;
		why += ` Extra spike at lag ${seasonalLag} is the calendar. That is m, not a reason to fit AR(${seasonalLag}).`;
	}
	return {
		acfCut,
		pacfCut,
		slowDecay,
		seasonalLag,
		suggest,
		why,
		suitable,
		dHint
	};
}
function residualVerdict(resid) {
	const hint = identify(resid, 16, 12);
	if (hint.slowDecay) return {
		ok: false,
		text: "Residuals still wander. You under-differenced, or a trend remains."
	};
	if (hint.suggest.startsWith("white")) return {
		ok: true,
		text: "Residual ACF is dead. The univariate structure is finished."
	};
	return {
		ok: false,
		text: `Residuals still look like ${hint.suggest}. The order is wrong, or a season / break remains.`
	};
}
function ChModels() {
	const [tab, setTab] = (0, import_react.useState)("uni");
	const [truth, setTruth] = (0, import_react.useState)("ar1");
	const [n, setN] = (0, import_react.useState)(220);
	const [seed, setSeed] = (0, import_react.useState)(8);
	const [phi, setPhi] = (0, import_react.useState)(.7);
	const [phi2, setPhi2] = (0, import_react.useState)(-.25);
	const [theta, setTheta] = (0, import_react.useState)(.6);
	const [p, setP] = (0, import_react.useState)(1);
	const [d, setD] = (0, import_react.useState)(0);
	const [q, setQ] = (0, import_react.useState)(0);
	const [P, setPs] = (0, import_react.useState)(0);
	const [D, setDs] = (0, import_react.useState)(1);
	const [Q, setQs] = (0, import_react.useState)(1);
	const [m, setM] = (0, import_react.useState)(12);
	const [h, setH] = (0, import_react.useState)(24);
	const [axy, setAxy] = (0, import_react.useState)(0);
	const [ayx, setAyx] = (0, import_react.useState)(.6);
	const y = (0, import_react.useMemo)(() => {
		if (truth === "white") return simulate("white", n, seed, { sigma: 1 });
		if (truth === "ar1") return simulate("ar1", n, seed, {
			phi,
			sigma: 1
		});
		if (truth === "ar2") return simulate("ar2", n, seed, {
			phi,
			phi2,
			sigma: 1
		});
		if (truth === "ma1") return simulate("ma1", n, seed, {
			theta,
			sigma: 1
		});
		if (truth === "ma2") return simulate("ma2", n, seed, {
			theta,
			theta2: .4,
			sigma: 1
		});
		if (truth === "arma11") return simulate("arma11", n, seed, {
			phi,
			theta,
			sigma: 1
		});
		if (truth === "rw") return simulate("rw", n, seed, { sigma: 1 });
		return simulate("season", n, seed, {
			level: 40,
			slope: .08,
			seasonAmp: 8,
			period: m,
			sigma: 1.2
		});
	}, [
		truth,
		n,
		seed,
		phi,
		phi2,
		theta,
		m
	]);
	const { fit, fc } = (0, import_react.useMemo)(() => {
		if (tab === "sarima") return forecastSARIMA(y, p, d, q, P, D, Q, m, h);
		return forecastARIMA(y, p, d, q, h);
	}, [
		tab,
		y,
		p,
		d,
		q,
		P,
		D,
		Q,
		m,
		h
	]);
	const hint = (0, import_react.useMemo)(() => {
		let z = y;
		if (tab === "sarima" && D > 0 && m > 1) z = seasonalDiff(z, m);
		if (d > 0) z = difference(z, d);
		return identify(z, 24, m);
	}, [
		tab,
		y,
		m,
		d,
		D
	]);
	const rv = residualVerdict(fit.resid);
	const grid = (0, import_react.useMemo)(() => gridARIMA(y, d, 2, 2), [y, d]);
	const rRes = acf(fit.resid, 18);
	const lb = ljungBox(fit.resid, 12);
	const shown = y.concat(Array(h).fill(null));
	const fcline = Array(y.length).fill(null).concat(fc);
	const pair = (0, import_react.useMemo)(() => bivariateVAR(n, seed, axy, ayx, 1), [
		n,
		seed,
		axy,
		ayx
	]);
	const eq = tab === "var" ? "y_t = a + Φ11 y_{t-1} + Φ12 x_{t-1} + ε" : tab === "sarima" ? `φ(B) Φ(B^m) (1-B)^d (1-B^m)^D y_t = θ(B) Θ(B^m) ε_t` : d > 0 ? `φ(B)(1-B)^${d} y_t = c + θ(B) ε_t` : "y_t = c + φ1 y_{t-1} + … + ε_t + θ1 ε_{t-1} + …";
	const wrongD = truth === "rw" && d === 0;
	const wrongAR = truth === "ma1" && p >= 1 && q === 0;
	const wrongMA = truth === "ar1" && q >= 1 && p === 0;
	const arOk = stationaryAR1(phi);
	const maOk = invertMA1(theta);
	const seasonalMiss = tab === "sarima" && truth === "season" && D === 0;
	const seasonalOk = tab === "sarima" && truth === "season" && D === 1;
	const airline = p === 0 && d === 1 && q === 1 && P === 0 && D === 1 && Q === 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "6 · Forecasting models"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "What does it remember?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "Past values → AR (VAR). Past shocks → MA (VMA). Both → ARMA. Calendar lag m → seasonal block. Nothing → white noise. Last value perfectly, φ=1 → random walk. Several series → the vector family."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Formula, { children: eq })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: tab,
					onChange: setTab,
					options: [
						{
							id: "uni",
							label: "AR / MA / ARIMA"
						},
						{
							id: "sarima",
							label: "SARIMA"
						},
						{
							id: "var",
							label: "VAR / VMA"
						}
					]
				}),
				tab !== "var" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Truth process vs the model you fit",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: truth,
							onChange: setTruth,
							options: [
								{
									id: "white",
									label: "WN"
								},
								{
									id: "ar1",
									label: "AR(1)"
								},
								{
									id: "ar2",
									label: "AR(2)"
								},
								{
									id: "ma1",
									label: "MA(1)"
								},
								{
									id: "ma2",
									label: "MA(2)"
								},
								{
									id: "arma11",
									label: "ARMA"
								},
								{
									id: "rw",
									label: "RW"
								},
								{
									id: "season",
									label: "Season"
								}
							]
						}),
						tab === "sarima" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "mt-3 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
							onClick: () => {
								setTruth("season");
								setP(0);
								setD(1);
								setQ(1);
								setPs(0);
								setDs(1);
								setQs(1);
								setM(12);
							},
							children: ["Try the airline model (0,1,1)(0,1,1)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "12" })]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
								series: [
									{
										name: "observed",
										y: shown,
										color: "var(--color-chart-1)"
									},
									{
										name: "fitted",
										y: fit.origFitted,
										color: "var(--color-chart-3)",
										dashed: true
									},
									{
										name: "forecast",
										y: fcline,
										color: "var(--color-chart-4)"
									}
								],
								splitAt: y.length - 1
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs text-muted-foreground",
							children: [
								"You fit ",
								tab === "sarima" ? "SARIMA" : "ARIMA",
								"(",
								p,
								",",
								d,
								",",
								q,
								")",
								tab === "sarima" ? `(${P},${D},{Q})_${m}` : "",
								" · plots suggest ",
								hint.suggest
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
						values: rRes,
						n: fit.resid.length,
						title: "Residual ACF — must be dead"
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "AIC search at this d",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
							headers: [
								"(p,d,q)",
								"AIC",
								"BIC"
							],
							rows: grid.slice(0, 6).map((g) => [
								`(${g.p},${g.d},${g.q})`,
								g.aic.toFixed(1),
								g.bic.toFixed(1)
							]),
							highlight: 0
						})
					})]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Two series, off-diagonal memory",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [{
						name: "x (driver if Φ_yx > 0)",
						y: pair.x,
						color: "var(--color-chart-1)"
					}, {
						name: "y (follower)",
						y: pair.y,
						color: "var(--color-chart-4)"
					}] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "VAR(p): each variable on p lags of all variables. VMA is the shock-spill representation (impulse responses). VARMA is flexible and painful. VARIMA differences the vector first — unless series wander together, in which case differencing independently throws away cointegration. Keep k small: k²p slopes." })]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							tab !== "var" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "Your p (AR)",
									value: p,
									min: 0,
									max: 4,
									step: 1,
									onChange: setP,
									hint: "PACF cutoff."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "Your d (I)",
									value: d,
									min: 0,
									max: 2,
									step: 1,
									onChange: setD,
									hint: "Do not read p,q until d is right."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "Your q (MA)",
									value: q,
									min: 0,
									max: 4,
									step: 1,
									onChange: setQ,
									hint: "ACF cutoff."
								}),
								tab === "sarima" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
										label: "P seasonal AR",
										value: P,
										min: 0,
										max: 1,
										step: 1,
										onChange: setPs,
										hint: "Lag m on the series."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
										label: "D seasonal diff",
										value: D,
										min: 0,
										max: 1,
										step: 1,
										onChange: setDs,
										hint: "y_t − y_{t−m}. This is the July-minus-July move."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
										label: "Q seasonal MA",
										value: Q,
										min: 0,
										max: 1,
										step: 1,
										onChange: setQs,
										hint: "Lag m on the shock."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
										label: "m",
										value: m,
										min: 4,
										max: 24,
										step: 1,
										onChange: setM
									})
								] }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "True φ",
									value: phi,
									min: -.9,
									max: 1.05,
									step: .05,
									onChange: setPhi
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "True φ₂",
									value: phi2,
									min: -.8,
									max: .8,
									step: .05,
									onChange: setPhi2
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
									label: "True θ",
									value: theta,
									min: -.9,
									max: .95,
									step: .05,
									onChange: setTheta
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Φ_xy  (y → x)",
								value: axy,
								min: -.8,
								max: .8,
								step: .05,
								onChange: setAxy,
								hint: "Yesterday's y in today's x."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Φ_yx  (x → y)",
								value: ayx,
								min: -.8,
								max: .8,
								step: .05,
								onChange: setAyx,
								hint: "Yesterday's x in today's y. This is the Granger door."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 360,
								step: 10,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "h",
								value: h,
								min: 6,
								max: 48,
								step: 2,
								onChange: setH
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Ljung–Box p",
						value: lb.p.toFixed(3)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "AIC",
						value: fit.aic.toFixed(1)
					})]
				}),
				tab === "var" ? Math.abs(ayx) < .1 && Math.abs(axy) < .1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "info",
					title: "Two univariate series wearing a costume",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Off-diagonals near 0. A VAR here is just two AR(1)s. Univariate ARIMA would not leave a channel on the table." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "A lagged channel exists",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Red is being pulled by blue (or the reverse). A univariate ARIMA on the follower leaves that channel unused. Next chapter: test it formally with Granger." })
				}) : seasonalMiss ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Not suitable — the calendar is still in the leftover",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"A yearly wave is not AR(",
						m,
						"). Raise D to 1: that is last July minus this July. Then read P and Q off the seasonal lags the same way you read p and q off the short lags. Residual: ",
						rv.text
					] })
				}) : seasonalOk && airline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Airline model — the classic seasonal workhorse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"(0,1,1)(0,1,1)",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "12" }),
						" differences the level and the calendar, then lets a short shock spill one month and one year. Residuals: ",
						rv.text,
						" Ljung–Box p = ",
						lb.p.toFixed(3),
						"."
					] })
				}) : seasonalOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Seasonal difference is doing the heavy lift",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"D = 1 took out the yearly jump. P and Q at lag m mop whatever calendar memory remains. If lag ",
						m,
						" is still standing in residual ACF, raise Q. Residual: ",
						rv.text
					] })
				}) : wrongD ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Not suitable — difference first",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						hint.why,
						" Fitting ARIMA(",
						p,
						",0,",
						q,
						") on a random walk is the classic mistake. ARIMA(0,1,0) is the honest model."
					] })
				}) : wrongAR ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "You put the memory on the wrong side",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Truth is MA(1): a shock spills one period. PACF tails off; ACF cuts off at 1. An AR(p) will need many lags to approximate a short MA. Residual: ", rv.text] })
				}) : wrongMA ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "MA cannot replace a persistent AR",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Truth is AR(1). PACF cuts off at 1; ACF tails off. An MA(q) is always stationary but has short memory in the innovations. Residual: ", rv.text] })
				}) : !arOk && truth.startsWith("ar") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "AR polynomial is explosive",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "|φ| ≥ 1. Roots must sit outside the unit circle. This is no longer a stationary AR." })
				}) : !maOk && truth.startsWith("ma") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "Not invertible",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "|θ| ≥ 1. Two MA models can share an ACF; you want the invertible one so shocks are recoverable from past y." })
				}) : rv.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Residuals look like leftover ignorance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						rv.text,
						" Ljung–Box p = ",
						lb.p.toFixed(3),
						". A small model with white residuals beats a large ARMA that fits the past and fails the future."
					] })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: "warn",
					title: "Unfinished",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: rv.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Plots on the raw series: ", hint.why] })]
				})
			]
		})]
	});
}
function sma(y, w) {
	return y.map((_, t) => {
		if (t + 1 < w) return null;
		let s = 0;
		for (let i = t + 1 - w; i <= t; i++) s += y[i];
		return s / w;
	});
}
function wma(y, w) {
	const den = w * (w + 1) / 2;
	return y.map((_, t) => {
		if (t + 1 < w) return null;
		let s = 0;
		for (let i = 0; i < w; i++) s += (i + 1) * y[t - w + 1 + i];
		return s / den;
	});
}
function ema(y, alpha) {
	if (!y.length) return [];
	const a = Math.min(.99, Math.max(.01, alpha));
	const o = [y[0]];
	for (let t = 1; t < y.length; t++) o.push(a * y[t] + (1 - a) * o[t - 1]);
	return o;
}
function sesForecast(y, alpha, h) {
	const L = ema(y, alpha);
	const last = L[L.length - 1] ?? 0;
	return {
		fitted: L,
		forecast: Array(h).fill(last)
	};
}
function holt(y, alpha, beta, h, phi = 1) {
	let L = y[0] ?? 0;
	let T = (y[1] ?? y[0] ?? 0) - (y[0] ?? 0);
	const fitted = [L];
	const a = alpha;
	const b = beta;
	const p = Math.min(.98, Math.max(.5, phi));
	for (let t = 1; t < y.length; t++) {
		const prevL = L;
		L = a * y[t] + (1 - a) * (prevL + p * T);
		T = b * (L - prevL) + (1 - b) * p * T;
		fitted.push(L);
	}
	const fc = [];
	for (let k = 1; k <= h; k++) {
		let s = 0;
		let pk = p;
		for (let i = 1; i <= k; i++) {
			s += pk;
			pk *= p;
		}
		fc.push(L + s * T);
	}
	return {
		fitted,
		forecast: fc,
		L,
		T
	};
}
function holtWinters(y, m, alpha, beta, gamma, h, multiplicative) {
	const period = Math.max(2, m);
	const L0 = y.slice(0, period).reduce((s, v) => s + v, 0) / period;
	let T = y.length >= 2 * period ? (y.slice(period, 2 * period).reduce((s, v) => s + v, 0) - y.slice(0, period).reduce((s, v) => s + v, 0)) / (period * period) : 0;
	let L = L0;
	const S = y.slice(0, period).map((v) => multiplicative ? v / Math.max(1e-6, L0) : v - L0);
	const fitted = [];
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
	const fc = [];
	for (let k = 1; k <= h; k++) {
		const s = S[(y.length + k - 1) % period];
		fc.push(multiplicative ? (L + k * T) * s : L + k * T + s);
	}
	return {
		fitted,
		forecast: fc
	};
}
function ChSmooth() {
	const [world, setWorld] = (0, import_react.useState)("season");
	const [method, setMethod] = (0, import_react.useState)("hw");
	const [n, setN] = (0, import_react.useState)(144);
	const [seed, setSeed] = (0, import_react.useState)(6);
	const [w, setW] = (0, import_react.useState)(7);
	const [alpha, setAlpha] = (0, import_react.useState)(.3);
	const [beta, setBeta] = (0, import_react.useState)(.15);
	const [gamma, setGamma] = (0, import_react.useState)(.2);
	const [phiDamp, setPhiDamp] = (0, import_react.useState)(1);
	const [m, setM] = (0, import_react.useState)(12);
	const [h, setH] = (0, import_react.useState)(18);
	const [multiHW, setMultiHW] = (0, import_react.useState)(true);
	const [cut, setCut] = (0, import_react.useState)(120);
	const full = (0, import_react.useMemo)(() => {
		if (world === "flat") return simulate("white", n, seed, { sigma: 2 }).map((v) => v + 20);
		if (world === "jump") return simulate("white", n, seed, { sigma: 1.4 }).map((v) => v + 18).map((v, t) => t >= 48 ? v + 10 : v);
		if (world === "trend") return simulate("trend", n, seed, {
			level: 20,
			slope: .18,
			sigma: 1.4
		});
		if (world === "multi") return simulate("multi", n, seed, {
			level: 30,
			slope: .12,
			seasonAmp: 5,
			period: m,
			sigma: 1.3
		});
		return simulate("season", n, seed, {
			level: 40,
			slope: .08,
			seasonAmp: 8,
			period: m,
			sigma: 1.2
		});
	}, [
		world,
		n,
		seed,
		m
	]);
	const origin = Math.min(full.length - 4, Math.max(m * 2, cut));
	const y = full.slice(0, origin);
	const hold = full.slice(origin, origin + h);
	const spanAlpha = 2 / (w + 1);
	const result = (0, import_react.useMemo)(() => {
		if (method === "sma") {
			const fitted = sma(y, w);
			const last = [...fitted].reverse().find((v) => v != null) ?? y[y.length - 1];
			return {
				fitted,
				fc: Array(h).fill(last)
			};
		}
		if (method === "wma") {
			const fitted = wma(y, w);
			const last = [...fitted].reverse().find((v) => v != null) ?? y[y.length - 1];
			return {
				fitted,
				fc: Array(h).fill(last)
			};
		}
		if (method === "ema") {
			const fitted = ema(y, alpha);
			return {
				fitted,
				fc: Array(h).fill(fitted[fitted.length - 1])
			};
		}
		if (method === "ses") {
			const s = sesForecast(y, alpha, h);
			return {
				fitted: s.fitted,
				fc: s.forecast
			};
		}
		if (method === "holt") {
			const s = holt(y, alpha, beta, h, phiDamp);
			return {
				fitted: s.fitted,
				fc: s.forecast
			};
		}
		const s = holtWinters(y, m, alpha, beta, gamma, h, multiHW);
		return {
			fitted: s.fitted,
			fc: s.forecast
		};
	}, [
		method,
		y,
		w,
		alpha,
		beta,
		gamma,
		h,
		m,
		multiHW,
		phiDamp
	]);
	const shown = full.slice(0, origin + hold.length);
	const fitPad = result.fitted.concat(Array(hold.length).fill(null));
	const fcPad = Array(origin).fill(null).concat(result.fc.slice(0, hold.length));
	const maeH = hold.length ? mae(hold, result.fc.slice(0, hold.length)) : 0;
	const rmseH = hold.length ? rmse(hold, result.fc.slice(0, hold.length)) : 0;
	const sesOnTrend = method === "ses" && (world === "trend" || world === "season" || world === "multi");
	const holtOnSeason = method === "holt" && (world === "season" || world === "multi");
	const hwOnFlat = method === "hw" && world === "flat";
	const addOnMulti = method === "hw" && world === "multi" && !multiHW;
	const filterNotForecast = method === "sma" || method === "wma" || method === "ema";
	const formula = method === "sma" ? `SMA_t(${w}) = (y_t + … + y_{t-${w - 1}}) / ${w}` : method === "wma" ? "recent points get larger weights; still a finite window" : method === "ema" || method === "ses" ? `L_t = α y_t + (1-α) L_{t-1}     ŷ_{t+h} = L_t` : method === "holt" ? "L_t, T_t   ·   ŷ_{t+h} = L_t + h T_t" : "L_t, T_t, S_t   ·   replay the wave";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "7 · Smoothing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "A running level, not an AR polynomial."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "Two costs you always pay: lag, and the over-smooth vs under-smooth trade. SMA / WMA / EMA are filters. SES / Holt / Holt–Winters are a forecasting system with state variables. Same recursion as EMA, extra states for slope and season."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Formula, { children: formula })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Match the method to the pieces you can see",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted-foreground",
								children: "World"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: world,
								onChange: setWorld,
								options: [
									{
										id: "flat",
										label: "Level"
									},
									{
										id: "jump",
										label: "Jump"
									},
									{
										id: "trend",
										label: "Trend"
									},
									{
										id: "season",
										label: "Add. season"
									},
									{
										id: "multi",
										label: "Growing season"
									}
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted-foreground",
								children: "Method"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: method,
								onChange: setMethod,
								options: [
									{
										id: "sma",
										label: "SMA"
									},
									{
										id: "wma",
										label: "WMA"
									},
									{
										id: "ema",
										label: "EMA"
									},
									{
										id: "ses",
										label: "SES"
									},
									{
										id: "holt",
										label: "Holt"
									},
									{
										id: "hw",
										label: "Holt–Winters"
									}
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
							series: [
								{
									name: "observed",
									y: shown,
									color: "var(--color-chart-1)"
								},
								{
									name: "fitted / filter",
									y: fitPad,
									color: "var(--color-chart-3)"
								},
								{
									name: "forecast",
									y: fcPad,
									color: "var(--color-chart-4)",
									dashed: true
								}
							],
							splitAt: origin - 1
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "EMA (pandas ewm) is a filter. SES is EMA used as a forecast: the level, held constant. Holt adds a slope. Holt–Winters adds seasonal factors. When someone says “we used exponential smoothing,” ask: SES, Holt, or Holt–Winters? Additive or multiplicative? What m?" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Window w",
								value: w,
								min: 2,
								max: 24,
								step: 1,
								onChange: setW,
								hint: `EMA span ${w} ⇔ α ≈ ${spanAlpha.toFixed(2)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "α level",
								value: alpha,
								min: .02,
								max: .95,
								step: .01,
								onChange: setAlpha,
								hint: "Near 0: tanker. Near 1: the new point is the truth. 0.99 ≈ random walk."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "β trend",
								value: beta,
								min: .01,
								max: .8,
								step: .01,
								onChange: setBeta
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "γ season",
								value: gamma,
								min: .01,
								max: .8,
								step: .01,
								onChange: setGamma,
								hint: "How fast this January may change from last January."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Damping φ",
								value: phiDamp,
								min: .6,
								max: 1,
								step: .02,
								onChange: setPhiDamp,
								hint: "<1 fades the slope. More honest at long h."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "m",
								value: m,
								min: 4,
								max: 24,
								step: 1,
								onChange: setM
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Origin (the cut)",
								value: cut,
								min: 48,
								max: n - 8,
								step: 1,
								onChange: setCut
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "h",
								value: h,
								min: 6,
								max: 36,
								step: 1,
								onChange: setH
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 240,
								step: 8,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Multiplicative HW", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: multiHW,
									onChange: (e) => setMultiHW(e.target.checked)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Holdout MAE",
						value: maeH.toFixed(2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Holdout RMSE",
						value: rmseH.toFixed(2)
					})]
				}),
				sesOnTrend ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "SES cannot predict growth",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Forecast shape is a horizontal line. On a trending series the forecasts sit systematically below the future path. No trend, no season → SES. Trend, no season → Holt. Trend and season → Holt–Winters." })
				}) : holtOnSeason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Holt strips the wave",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Forecast is a slope with the seasonal wave ignored. July peaks are treated as noise. Add γ and m, or you will miss every calendar peak." })
				}) : addOnMulti ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "Additive season on growing waves",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Seasonal swing scales with the level — typical of growing sales. Use multiplicative Holt–Winters, or log first. Same choice as in decomposition." })
				}) : hwOnFlat ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "Three states for a flat line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You are estimating a slope and twelve seasonal factors that are not there. Extra γ will chase noise. Match the method to the components you can see." })
				}) : filterNotForecast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "info",
					title: "This is a filter",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "SMA equal-weights a finite window (drop-off kinks). WMA hugs turns faster. EMA never fully drops the past. The dashed line is “hold the last smoother value,” not a serious forecast family." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Method matches the pieces",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Small α is slow to accept a jump and calm on noise. Large α accepts the jump and rides the noise. In software α is usually estimated by one-step error — still look at it." })
				})
			]
		})]
	});
}
function granger(y, x, p) {
	const n = Math.min(y.length, x.length);
	const Y = [];
	const XR = [];
	const XU = [];
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
	const br = ridgeFit(XR, Y, 1e-4);
	const bu = ridgeFit(XU, Y, 1e-4);
	if (!br || !bu) return {
		f: 0,
		pval: 1,
		rssR: 0,
		rssU: 0,
		helps: false
	};
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
	const f = (rssR - rssU) / q / (rssU / Math.max(1, df));
	const pval = fCdfTail(f, q, Math.max(1, df));
	return {
		f,
		pval,
		rssR,
		rssU,
		helps: pval < .05
	};
}
function fCdfTail(f, d1, d2) {
	return incompleteBeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);
}
function incompleteBeta(x, a, b) {
	x = Math.min(1, Math.max(0, x));
	if (x === 0) return 0;
	if (x === 1) return 1;
	const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
	const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;
	let f = 1;
	let c = 1;
	let d = 1 - (a + b) * x / (a + 1);
	if (Math.abs(d) < 1e-30) d = 1e-30;
	d = 1 / d;
	f = d;
	for (let m = 1; m <= 80; m++) {
		const m2 = 2 * m;
		let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
		d = 1 + aa * d;
		c = 1 + aa / c;
		if (Math.abs(d) < 1e-30) d = 1e-30;
		if (Math.abs(c) < 1e-30) c = 1e-30;
		d = 1 / d;
		f *= d * c;
		aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
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
function logGamma(z) {
	const c = [
		76.18009172947146,
		-86.50532032941678,
		24.01409824083091,
		-1.231739572450155,
		.001208650973866179,
		-5395239384953e-18
	];
	let x = z;
	let y = z;
	let tmp = x + 5.5;
	tmp -= (x + .5) * Math.log(tmp);
	let ser = 1.000000000190015;
	for (let j = 0; j < 6; j++) ser += c[j] / ++y;
	return -tmp + Math.log(2.5066282746310007 * ser / x);
}
function ChGranger() {
	const [world, setWorld] = (0, import_react.useState)("x2y");
	const [n, setN] = (0, import_react.useState)(220);
	const [seed, setSeed] = (0, import_react.useState)(13);
	const [p, setP] = (0, import_react.useState)(2);
	const [strength, setStrength] = (0, import_react.useState)(.55);
	const [diff, setDiff] = (0, import_react.useState)(false);
	const pair = (0, import_react.useMemo)(() => {
		if (world === "none") return bivariateVAR(n, seed, 0, 0, 1);
		if (world === "x2y") return bivariateVAR(n, seed, 0, strength, 1);
		if (world === "y2x") return bivariateVAR(n, seed, strength, 0, 1);
		if (world === "both") return bivariateVAR(n, seed, strength * .7, strength * .7, 1);
		if (world === "rwfake") return {
			x: simulate("rw", n, seed, { sigma: 1 }),
			y: simulate("rw", n, seed + 1, { sigma: 1 })
		};
		const z = simulate("ar1", n, seed, {
			phi: .7,
			sigma: 1
		});
		return {
			x: z.map((v, i) => v + simulate("white", n, seed + 4, { sigma: .7 })[i]),
			y: z.map((v, i) => .9 * v + simulate("white", n, seed + 7, { sigma: .7 })[i])
		};
	}, [
		world,
		n,
		seed,
		strength
	]);
	const x = diff ? difference(pair.x, 1) : pair.x;
	const y = diff ? difference(pair.y, 1) : pair.y;
	const xy = granger(y, x, p);
	const yx = granger(x, y, p);
	const read = () => {
		if (xy.helps && !yx.helps) return "X Granger-causes Y (one way)";
		if (yx.helps && !xy.helps) return "Y Granger-causes X (one way)";
		if (xy.helps && yx.helps) return "Feedback — they forecast each other";
		return "Neither direction helps";
	};
	const fake = world === "rwfake" && !diff;
	const confounder = world === "z";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "8 · Granger causality"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "Predictive content in time — not a mechanism."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "X Granger-causes Y if past X helps you forecast Y beyond what past Y already does. Always run both directions. It is not “X caused Y in the real world.” Rain Granger-causes umbrella sales. Umbrella sales can Granger-cause rain readings if shops stock just before the monsoon."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Formula, { children: [
						"H",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "0" }),
						": b",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "1" }),
						" = … = b",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "p" }),
						" = 0 in Y on own lags + lags of X"
					] })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Two series",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						value: world,
						onChange: setWorld,
						options: [
							{
								id: "none",
								label: "Independent"
							},
							{
								id: "x2y",
								label: "X → Y"
							},
							{
								id: "y2x",
								label: "Y → X"
							},
							{
								id: "both",
								label: "Feedback"
							},
							{
								id: "rwfake",
								label: "Two walks"
							},
							{
								id: "z",
								label: "Hidden Z"
							}
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [{
							name: "X",
							y: x,
							color: "var(--color-chart-1)"
						}, {
							name: "Y",
							y,
							color: "var(--color-chart-4)"
						}] })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Both directions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
									children: "Does X help Y?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl",
									children: xy.helps ? "Reject H0" : "Fail to reject"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono text-xs text-muted-foreground",
									children: [
										"F = ",
										xy.f.toFixed(2),
										" · p = ",
										xy.pval.toFixed(3)
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
									children: "Does Y help X?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl",
									children: yx.helps ? "Reject H0" : "Fail to reject"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono text-xs text-muted-foreground",
									children: [
										"F = ",
										yx.f.toFixed(2),
										" · p = ",
										yx.pval.toFixed(3)
									]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-foreground",
						children: [read(), "."]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Lag p",
								value: p,
								min: 1,
								max: 8,
								step: 1,
								onChange: setP,
								hint: "Too short: miss delayed effects. Too long: waste degrees of freedom. Quarterly data often starts at 4 or 8."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Channel strength",
								value: strength,
								min: 0,
								max: .9,
								step: .05,
								onChange: setStrength
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 400,
								step: 10,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 40,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Difference both", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: diff,
									onChange: (e) => setDiff(e.target.checked)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "RSS restricted",
						value: xy.rssR.toFixed(1)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "RSS unrestricted",
						value: xy.rssU.toFixed(1)
					})]
				}),
				fake ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Not valid on raw random walks",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Two independent walks can look related just because both wander. Standard practice: difference to stationarity, or work in a VECM if they share a long-run level. Toggle “Difference both.”" })
				}) : confounder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "A third series Z drives both",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Oil prices can drive inflation and the policy rate. A two-variable test then lies. Granger assumes you have not left out the thing that actually moves." })
				}) : world === "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Suitable negative",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Knowing one does not improve the short-term forecast of the other, at least at these lags. That is a real result. Granger belongs with VAR, not with univariate ARIMA." })
				}) : xy.helps || yx.helps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: read(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Rejecting “A does not Granger-cause S” and failing the reverse is the pattern you hope for in a campaign: advertising helps predict sales; sales do not help predict advertising. Feedback means budgets follow sales and also lift later sales." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "info",
					title: "No extra predictive content at this p",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Try a longer lag if the channel is delayed, or a stronger coefficient. Absence of Granger is not absence of a real-world link." })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "It is a statement about forecasts, not about true physical or moral cause. The test cannot see the mechanism." })
			]
		})]
	});
}
function ChAcf() {
	const [truth, setTruth] = (0, import_react.useState)("ar1");
	const [n, setN] = (0, import_react.useState)(280);
	const [seed, setSeed] = (0, import_react.useState)(2);
	const [phi, setPhi] = (0, import_react.useState)(.7);
	const [phi2, setPhi2] = (0, import_react.useState)(-.3);
	const [theta, setTheta] = (0, import_react.useState)(.65);
	const [m, setM] = (0, import_react.useState)(12);
	const [d, setD] = (0, import_react.useState)(0);
	const [Ds, setDs] = (0, import_react.useState)(0);
	const [maxLag, setMaxLag] = (0, import_react.useState)(28);
	const raw = (0, import_react.useMemo)(() => {
		if (truth === "white") return simulate("white", n, seed, { sigma: 1 });
		if (truth === "ar1") return simulate("ar1", n, seed, {
			phi,
			sigma: 1
		});
		if (truth === "ar2") return simulate("ar2", n, seed, {
			phi,
			phi2,
			sigma: 1
		});
		if (truth === "ma1") return simulate("ma1", n, seed, {
			theta,
			sigma: 1
		});
		if (truth === "ma2") return simulate("ma2", n, seed, {
			theta,
			theta2: .45,
			sigma: 1
		});
		if (truth === "arma11") return simulate("arma11", n, seed, {
			phi,
			theta,
			sigma: 1
		});
		if (truth === "rw") return simulate("rw", n, seed, { sigma: 1 });
		return simulate("season", n, seed, {
			level: 20,
			slope: .06,
			seasonAmp: 7,
			period: m,
			sigma: 1.1
		});
	}, [
		truth,
		n,
		seed,
		phi,
		phi2,
		theta,
		m
	]);
	const y = (0, import_react.useMemo)(() => {
		let z = raw;
		if (d) z = difference(z, d);
		if (Ds) z = seasonalDiff(z, m);
		return z;
	}, [
		raw,
		d,
		Ds,
		m
	]);
	const r = acf(y, maxLag);
	const p = pacf(y, Math.min(18, maxLag));
	const hint = identify(y, maxLag, m);
	const b = band(y.length);
	const seasonalLags = m > 1 ? [
		m,
		2 * m,
		3 * m
	].filter((k) => k <= maxLag) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "9 · ACF and PACF"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "Total memory versus extra memory."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "ACF at lag k is the ordinary correlation with the series shifted by k — including memory that merely travels through the in-between lags. PACF at lag k is that correlation after lags 1…k−1 have been partialled out. Memory aid: PACF → P for AR(p). ACF carries the MA(q)."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Formula, { children: [
						"ρ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "k" }),
						" = Cov(y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						", y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t−k" }),
						") / Var(y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						") · band ±1.96/√T"
					] })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Identify from the plots",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: truth,
							onChange: setTruth,
							options: [
								{
									id: "white",
									label: "WN"
								},
								{
									id: "ar1",
									label: "AR(1)"
								},
								{
									id: "ar2",
									label: "AR(2)"
								},
								{
									id: "ma1",
									label: "MA(1)"
								},
								{
									id: "ma2",
									label: "MA(2)"
								},
								{
									id: "arma11",
									label: "ARMA"
								},
								{
									id: "rw",
									label: "Walk"
								},
								{
									id: "season",
									label: "Season"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
								series: [{
									name: d || Ds ? "repaired series" : "series",
									y,
									color: "var(--color-chart-1)"
								}],
								height: 160
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
								values: r,
								n: y.length,
								title: "ACF — reads q",
								highlight: seasonalLags
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcfBars, {
								values: p,
								n: y.length,
								title: "PACF — reads p",
								highlight: seasonalLags
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs text-muted-foreground",
							children: [
								"cutoff ACF ",
								hint.acfCut,
								" · cutoff PACF ",
								hint.pacfCut,
								" · band ",
								b.toFixed(2)
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "After the series is stationary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: ["Pattern", "Model to try"],
						rows: [
							["ACF and PACF both dead", "White noise. Stop."],
							["PACF cuts off at p; ACF tails off", "AR(p)"],
							["ACF cuts off at q; PACF tails off", "MA(q)"],
							["Both tail off", "ARMA(p,q), search small values"],
							["Slow linear ACF before differencing", "Raise d, usually to 1, and redraw"],
							["Spikes at multiples of m", "Seasonal terms; maybe D = 1"],
							["Residual ACF still spiked", "Wrong order, or a season / break remains"]
						]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "True φ",
								value: phi,
								min: -.9,
								max: .95,
								step: .05,
								onChange: setPhi
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "True φ₂",
								value: phi2,
								min: -.8,
								max: .6,
								step: .05,
								onChange: setPhi2,
								hint: "AR(2) with opposite signs often oscillates."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "True θ",
								value: theta,
								min: -.9,
								max: .95,
								step: .05,
								onChange: setTheta
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "d (then read plots)",
								value: d,
								min: 0,
								max: 2,
								step: 1,
								onChange: setD,
								hint: "You do not read p and q on a wandering mean."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seasonal D",
								value: Ds,
								min: 0,
								max: 1,
								step: 1,
								onChange: setDs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "m",
								value: m,
								min: 4,
								max: 24,
								step: 1,
								onChange: setM
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Max lag",
								value: maxLag,
								min: 12,
								max: 48,
								step: 1,
								onChange: setMaxLag,
								hint: "If you look at 40 lags, expect a couple of false spikes."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 80,
								max: 400,
								step: 10,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							})
						]
					})
				}),
				hint.slowDecay && d === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Not suitable to read p, q yet",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: hint.why })
				}) : truth === "season" && Ds === 0 && hint.seasonalLag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: `m = ${hint.seasonalLag}, not AR(${hint.seasonalLag})`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Extra ACF spikes at ",
						m,
						", ",
						2 * m,
						", ",
						3 * m,
						" are the calendar. If those spikes themselves die slowly, take a seasonal difference. Then read P and Q off the seasonal lags the same way you read p and q off the short lags."
					] })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Verdict, {
					tone: hint.suitable ? "good" : "warn",
					title: hint.suggest,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: hint.why }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Cutoff means: outside the band up to that lag, then inside and stays there. Tail off means: shrinks gradually — a geometric decay or a dying wave, not a cliff." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "Orders: p AR, d differences, q MA, m period, and for SARIMA also P, D, Q at that seasonal lag. Always close the loop: fit, then plot residual ACF. If lag 12 is still standing, you did not finish the seasonal part." })
			]
		})]
	});
}
function forwardFill(y) {
	const o = [];
	let last = 0;
	for (const v of y) if (v == null) o.push(last);
	else {
		last = v;
		o.push(v);
	}
	return o;
}
function linearFill(y) {
	const o = y.slice();
	let i = 0;
	while (i < o.length) {
		if (o[i] != null) {
			i++;
			continue;
		}
		let j = i;
		while (j < o.length && o[j] == null) j++;
		const left = i > 0 ? o[i - 1] : o[j] ?? 0;
		const right = j < o.length ? o[j] : left;
		const span = j - i + 1;
		for (let k = i; k < j; k++) {
			const w = (k - i + 1) / span;
			o[k] = left * (1 - w) + right * w;
		}
		i = j;
	}
	return o.map((v) => v == null ? 0 : v);
}
function seasonalFill(y, m) {
	const o = y.slice();
	for (let i = 0; i < o.length; i++) {
		if (o[i] != null) continue;
		const prev = i >= m ? o[i - m] : null;
		const next = i + m < o.length ? o[i + m] : null;
		if (prev != null && next != null) o[i] = .5 * (prev + next);
		else if (prev != null) o[i] = prev;
		else if (next != null) o[i] = next;
		else o[i] = 0;
	}
	return o.map((v) => v == null ? 0 : v);
}
function metrics(a, p, season) {
	return {
		mae: mae(a, p),
		mse: mse(a, p),
		rmse: rmse(a, p),
		mape: mape(a, p),
		smape: smape(a, p),
		mase: mase(a, p, season)
	};
}
function ChEval() {
	const [tab, setTab] = (0, import_react.useState)("score");
	const [n, setN] = (0, import_react.useState)(144);
	const [seed, setSeed] = (0, import_react.useState)(3);
	const [cut, setCut] = (0, import_react.useState)(120);
	const [spike, setSpike] = (0, import_react.useState)(0);
	const [shuffleSplit, setShuffleSplit] = (0, import_react.useState)(false);
	const [level, setLevel] = (0, import_react.useState)(40);
	const [miss, setMiss] = (0, import_react.useState)(.08);
	const [block, setBlock] = (0, import_react.useState)(false);
	const [fill, setFill] = (0, import_react.useState)("linear");
	const [overfitP, setOverfitP] = (0, import_react.useState)(3);
	const raw = (0, import_react.useMemo)(() => simulate("season", n, seed, {
		level,
		slope: .1,
		seasonAmp: 8,
		period: 12,
		sigma: 1.4
	}), [
		n,
		seed,
		level
	]);
	const spiked = (0, import_react.useMemo)(() => {
		if (!spike) return raw;
		return injectOutlier(raw, Math.min(raw.length - 5, cut + 6), spike);
	}, [
		raw,
		spike,
		cut
	]);
	const origin = Math.min(spiked.length - 4, Math.max(24, cut));
	const train = spiked.slice(0, origin);
	const test = spiked.slice(origin);
	const shuffled = (0, import_react.useMemo)(() => shuffle(spiked, seed + 9), [spiked, seed]);
	const cheatTrain = shuffled.slice(0, origin);
	const cheatTest = shuffled.slice(origin);
	const models = (0, import_react.useMemo)(() => {
		const h = test.length;
		const naive = Array(h).fill(train[train.length - 1]);
		const mu = mean(train);
		const meanFc = Array(h).fill(mu);
		const ses = sesForecast(train, .3, h).forecast;
		const ho = holt(train, .3, .15, h).forecast;
		const hw = holtWinters(train, 12, .3, .15, .2, h, false).forecast;
		const ar = forecastARIMA(train, 1, 1, 1, h).fc;
		const names = [
			"Naive",
			"Mean",
			"SES",
			"Holt",
			"HW",
			"ARIMA(1,1,1)"
		];
		const fcs = [
			naive,
			meanFc,
			ses,
			ho,
			hw,
			ar
		];
		return names.map((name, i) => ({
			name,
			fc: fcs[i],
			...metrics(test, fcs[i], 12)
		}));
	}, [train, test]);
	const cheat = (0, import_react.useMemo)(() => {
		const h = cheatTest.length;
		const hw = holtWinters(cheatTrain, 12, .3, .15, .2, h, false).forecast;
		return metrics(cheatTest, hw, 12);
	}, [cheatTrain, cheatTest]);
	const honestHW = models.find((m) => m.name === "HW");
	const rankingMae = [...models].sort((a, b) => a.mae - b.mae);
	const rankingRmse = [...models].sort((a, b) => a.rmse - b.rmse);
	const grid = (0, import_react.useMemo)(() => gridARIMA(train, 1, overfitP, 2), [train, overfitP]);
	const missing = (0, import_react.useMemo)(() => withMissing(raw, miss, seed, block), [
		raw,
		miss,
		seed,
		block
	]);
	const filled = (0, import_react.useMemo)(() => {
		if (fill === "ffill") return forwardFill(missing);
		if (fill === "season") return seasonalFill(missing, 12);
		return linearFill(missing);
	}, [missing, fill]);
	const shownTest = Array(origin).fill(null).concat(test);
	const shownHw = Array(origin).fill(null).concat(honestHW.fc);
	const mapeBroken = honestHW.mape == null;
	const rmseGap = honestHW.rmse / Math.max(1e-6, honestHW.mae);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
						children: "10 · Evaluation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl",
						children: "Score a future it was not allowed to see."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: "MAE, MSE, RMSE, MAPE score predictions against a hold-out. AIC and BIC score how well a model describes the sample it was estimated on, with a tax on extra parameters. They are not a substitute for a hold-out. Never shuffle time. The cut is a date."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Formula, { children: [
						"e",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" = y",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" − ŷ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" })
					] })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: tab,
					onChange: setTab,
					options: [
						{
							id: "score",
							label: "Hold-out metrics"
						},
						{
							id: "aic",
							label: "AIC / BIC"
						},
						{
							id: "prep",
							label: "Holes & spikes"
						}
					]
				}),
				tab === "score" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "One series, several scores",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, {
						series: [
							{
								name: "actual",
								y: spiked,
								color: "var(--color-chart-1)"
							},
							{
								name: "Holt–Winters",
								y: shownHw,
								color: "var(--color-chart-4)",
								dashed: true
							},
							{
								name: "hold-out actual",
								y: shownTest,
								color: "var(--color-chart-3)"
							}
						],
						splitAt: origin - 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBars, {
							labels: models.map((m) => m.name),
							values: models.map((m) => m.mae),
							highlight: models.findIndex((m) => m.name === rankingMae[0].name)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "The ranking can change with the metric",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: [
							"Model",
							"MAE",
							"RMSE",
							"MAPE",
							"MASE"
						],
						rows: models.map((m) => [
							m.name,
							m.mae.toFixed(2),
							m.rmse.toFixed(2),
							m.mape == null ? "undefined" : m.mape.toFixed(1) + "%",
							m.mase.toFixed(2)
						]),
						highlight: models.findIndex((m) => m.name === rankingMae[0].name)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: [
							"MAE winner ",
							rankingMae[0].name,
							" · RMSE winner ",
							rankingRmse[0].name,
							rankingMae[0].name !== rankingRmse[0].name ? " — they disagree." : ".",
							" Rule of thumb: RMSE ≈ 1.25 × MAE when errors are not wild. Here RMSE/MAE = ",
							rmseGap.toFixed(2),
							"."
						]
					})]
				})] }) : null,
				tab === "aic" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "In-sample error always falls. AIC tells you when to stop.",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
						headers: [
							"(p,1,q)",
							"AIC",
							"BIC"
						],
						rows: grid.map((g) => [
							`(${g.p},1,${g.q})`,
							g.aic.toFixed(1),
							g.bic.toFixed(1)
						]),
						highlight: 0
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, { children: "AIC = −2 log L̂ + 2k. BIC replaces 2k with k log n, so in large samples it prefers simpler models. Neither is the truth. You cannot compare a model on levels with a model on logs. A model can win AIC and lose next year." })]
				}) : null,
				tab === "prep" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Dropping a row changes every lag",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinePlot, { series: [{
						name: "filled (pretend actuals)",
						y: filled,
						color: "var(--color-chart-5)",
						dashed: true
					}, {
						name: "true series",
						y: raw,
						color: "var(--color-chart-1)"
					}] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "Scattered holes can be interpolated if short relative to the season. A block hole invents a fake week if you linearly fill it. Never fill first and then congratulate the model for “predicting” the filled values. Imputed points are not actuals."
					})]
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Parameters",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "The cut (origin)",
								value: cut,
								min: 36,
								max: n - 6,
								step: 1,
								onChange: setCut,
								hint: "Train earlier, test later."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Hold-out spike",
								value: spike,
								min: 0,
								max: 40,
								step: 1,
								onChange: setSpike,
								hint: "MSE/RMSE treat one disaster as a crisis. MAE treats it as one large miss. MAPE depends on the level of y_t."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Level of y",
								value: level,
								min: 5,
								max: 80,
								step: 1,
								onChange: setLevel,
								hint: "MAPE explodes when actuals are near 0."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Missing fraction",
								value: miss,
								min: 0,
								max: .35,
								step: .01,
								onChange: setMiss
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "AIC p max",
								value: overfitP,
								min: 1,
								max: 4,
								step: 1,
								onChange: setOverfitP
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "n",
								value: n,
								min: 72,
								max: 240,
								step: 12,
								onChange: setN
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Seed",
								value: seed,
								min: 1,
								max: 30,
								step: 1,
								onChange: setSeed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Shuffle the split", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: shuffleSplit,
									onChange: (e) => setShuffleSplit(e.target.checked)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center justify-between rounded-lg border border-border bg-secondary px-3 text-sm",
								children: ["Block holes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: block,
									onChange: (e) => setBlock(e.target.checked)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs text-muted-foreground",
								children: "Fill method"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: fill,
								onChange: setFill,
								options: [
									{
										id: "ffill",
										label: "Forward"
									},
									{
										id: "linear",
										label: "Linear"
									},
									{
										id: "season",
										label: "Seasonal"
									}
								]
							})] })
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Honest HW MAE",
						value: honestHW.mae.toFixed(2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Shuffled HW MAE",
						value: cheat.mae.toFixed(2)
					})]
				}),
				shuffleSplit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "You leaked the future",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Random split MAE ",
						cheat.mae.toFixed(2),
						" vs honest time-cut ",
						honestHW.mae.toFixed(2),
						". The shuffled number is not a forecast score. It is a description of a series that no longer exists."
					] })
				}) : spike > 12 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "warn",
					title: "One miss is dominating RMSE",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"MAE is the typical miss, in the units of the series. RMSE is pulled up by the tail. If RMSE is much larger than MAE, look at those periods before you redesign the model. MAPE is",
						" ",
						mapeBroken ? "undefined (actual near 0)" : "asymmetric and explodes at zero",
						". Prefer MAE+RMSE always; add MAPE only if every actual is safely away from zero."
					] })
				}) : tab === "prep" && block && fill === "linear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "bad",
					title: "Linear fill across a block invents a week",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Keep the timestamp, store a hole. Forward fill is deadly if you fill a week of demand with Friday. Seasonal fill (this Tuesday from nearby Tuesdays) is the honest interpolation when the week is the unit." })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
					tone: "good",
					title: "Time-respecting hold-out",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Report MAE and RMSE always. Look at a plot of e",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", { children: "t" }),
						" — a metric will not show you that all the error sits in June. AIC is for comparing orders in the modelling room, on the same series, same transform, same sample."
					] })
				})
			]
		})]
	});
}
function ChapterBody({ id }) {
	switch (id) {
		case 1: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChIntro, {});
		case 2: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChDecomp, {});
		case 3: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChStl, {});
		case 4: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChStationarity, {});
		case 5: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChNoise, {});
		case 6: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChModels, {});
		case 7: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChSmooth, {});
		case 8: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChGranger, {});
		case 9: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChAcf, {});
		case 10: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChEval, {});
		default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChIntro, {});
	}
}
function readHash() {
	if (typeof window === "undefined") return 1;
	const n = Number(window.location.hash.replace(/\D/g, ""));
	if (n >= 1 && n <= 10) return n;
	return 1;
}
function LabApp() {
	const [id, setId] = (0, import_react.useState)(1);
	const [open, setOpen] = (0, import_react.useState)(false);
	const current = CHAPTERS.find((c) => c.id === id);
	(0, import_react.useEffect)(() => {
		setId(readHash());
		const onHash = () => setId(readHash());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);
	const go = (next) => {
		setId(next);
		if (typeof window !== "undefined") window.history.replaceState(null, "", `#${next}`);
		setOpen(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
								children: "A workshop"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl leading-none sm:text-3xl",
								children: "The Time Cut"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden max-w-sm text-right text-xs text-muted-foreground md:block",
							children: "Never shuffle time. Train on the earlier part, test on the later part."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "h-11 shrink-0 px-3 lg:hidden",
							"aria-label": "Open chapters",
							onClick: () => setOpen(true),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[11px] tabular-nums",
									children: String(id).padStart(2, "0")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chapters" })
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-r border-border p-3 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "space-y-0.5",
						"aria-label": "Chapters",
						children: CHAPTERS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => go(c.id),
							className: cn("flex min-h-11 w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors duration-150", id === c.id ? "bg-card text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[10px] tabular-nums text-muted-foreground",
								children: String(c.id).padStart(2, "0")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: c.title
							})]
						}, c.id))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "min-w-0 px-4 py-5 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
							children: [
								String(current.id).padStart(2, "0"),
								" · ",
								current.blurb
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChapterBody, { id }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex items-center justify-between border-t border-border pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "h-11",
								disabled: id === 1,
								onClick: () => go(id - 1),
								children: "Previous"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "h-11",
								disabled: id === 10,
								onClick: () => go(id + 1),
								children: "Next chapter"
							})]
						})
					]
				})]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-30 lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 bg-background/70",
					"aria-label": "Close chapters",
					onClick: () => setOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-y-0 left-0 w-[min(18rem,90vw)] overflow-y-auto border-r border-border bg-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-3 pb-2 font-display text-xl",
						children: "Chapters"
					}), CHAPTERS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => go(c.id),
						className: cn("flex min-h-11 w-full flex-col rounded-lg px-3 py-3 text-left", id === c.id ? "bg-secondary text-foreground" : "text-muted-foreground"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[10px]",
								children: String(c.id).padStart(2, "0")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: c.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-muted-foreground",
								children: c.blurb
							})
						]
					}, c.id))]
				})]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabApp, {});
}
//#endregion
export { Home as component };
