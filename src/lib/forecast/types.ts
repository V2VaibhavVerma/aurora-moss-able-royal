export type Row = {
  unique_id: string;
  timeperiod: string;
  apheresis_sales: number;
  enrollments: number;
  calls: number;
  holiday_days: number;
  holiday_intensity: number;
};

export type Point = {
  t: string;
  sales: number;
  enrollments: number;
  holiday: number;
};

export type NationalModel =
  | "mean"
  | "persist"
  | "snaive"
  | "ewma"
  | "ses"
  | "hw"
  | "arima"
  | "sarima"
  | "ols"
  | "ridge"
  | "ensemble";

export type SiteMethod =
  | "ensemble"
  | "mean"
  | "ewma"
  | "hw"
  | "ols"
  | "croston"
  | "snaive"
  | "persist"
  | "ses";

export type LabParams = {
  origin: string;
  skipMonths: number;
  horizon: number;
  clipNegative: boolean;
  dropPaddedTail: boolean;

  nationalModel: NationalModel;
  meanWindow: number;
  ewmaSpan: number;
  sesAlpha: number;

  hwTrend: boolean;
  hwSeasonal: boolean;
  hwDamped: boolean;
  hwPhi: number;
  seasonalPeriod: number;
  hwAlpha: number;
  hwBeta: number;
  hwGamma: number;
  hwAuto: boolean;

  arimaP: number;
  arimaD: number;
  arimaQ: number;
  sarimaP: number;
  sarimaD: number;
  sarimaQ: number;

  ridgeLambda: number;
  useYLag: boolean;
  useEnrollL1: boolean;
  useEnrollL2: boolean;
  useHoliday: boolean;
  useTrend: boolean;
  enrollFreezeWindow: number;

  matureIds: string[];
  interIds: string[];
  matureMethod: SiteMethod;
  interMethod: SiteMethod;
  wMean6: number;
  wMean12: number;
  wEwma: number;
  crostonWindow: number;
  blendMean12: number;
};

export const SITES = [
  "ID1",
  "ID2",
  "ID3",
  "ID4",
  "ID5",
  "ID6",
  "ID7",
  "ID8",
  "ID9",
  "ID10",
] as const;

export const DEFAULT_MATURE = ["ID1", "ID4", "ID5", "ID7", "ID10"];
export const DEFAULT_INTER = ["ID2", "ID3", "ID6", "ID8", "ID9"];

export const DEFAULT_PARAMS: LabParams = {
  origin: "2026-01-01",
  skipMonths: 1,
  horizon: 3,
  clipNegative: true,
  dropPaddedTail: true,
  nationalModel: "mean",
  meanWindow: 12,
  ewmaSpan: 6,
  sesAlpha: 0.3,
  hwTrend: true,
  hwSeasonal: true,
  hwDamped: false,
  hwPhi: 0.9,
  seasonalPeriod: 12,
  hwAlpha: 0.3,
  hwBeta: 0.1,
  hwGamma: 0.2,
  hwAuto: true,
  arimaP: 0,
  arimaD: 1,
  arimaQ: 1,
  sarimaP: 1,
  sarimaD: 0,
  sarimaQ: 1,
  ridgeLambda: 8,
  useYLag: true,
  useEnrollL1: true,
  useEnrollL2: true,
  useHoliday: true,
  useTrend: true,
  enrollFreezeWindow: 3,
  matureIds: [...DEFAULT_MATURE],
  interIds: [...DEFAULT_INTER],
  matureMethod: "ensemble",
  interMethod: "croston",
  wMean6: 1,
  wMean12: 1,
  wEwma: 1,
  crostonWindow: 18,
  blendMean12: 0,
};

export type Score = {
  mae: number;
  rmse: number;
  bias: number;
  volWmae: number;
};

export type ModelForecast = {
  id: string;
  family: string;
  pred: number[];
  score: Score;
};
