export const CHAPTERS = [
  { id: 1, slug: "object", title: "Time series", blurb: "Order is the information." },
  { id: 2, slug: "decomp", title: "Decomposition", blurb: "Trend, season, cycle, leftover." },
  { id: 3, slug: "stl", title: "STL", blurb: "LOESS twice. Residual is the verdict." },
  { id: 4, slug: "stationarity", title: "Stationarity", blurb: "Same rules next year." },
  { id: 5, slug: "noise", title: "White noise", blurb: "Stacked shocks, or not." },
  { id: 6, slug: "models", title: "ARIMA family", blurb: "What does it remember?" },
  { id: 7, slug: "smooth", title: "Smoothing", blurb: "Level, slope, season as state." },
  { id: 8, slug: "granger", title: "Granger", blurb: "Predictive content, not cause." },
  { id: 9, slug: "acf", title: "ACF / PACF", blurb: "Read p, d, q, m from plots." },
  { id: 10, slug: "eval", title: "Evaluation", blurb: "Score a future it did not see." },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];
