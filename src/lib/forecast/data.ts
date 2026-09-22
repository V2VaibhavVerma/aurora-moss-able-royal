import raw from "./data.json";
import type { Point, Row } from "./types";
import { SITES } from "./types";
import { addMonths } from "./dates";

export const ROWS: Row[] = raw as Row[];

export const ALL_MONTHS: string[] = Array.from(
  new Set(ROWS.map((r) => r.timeperiod)),
).sort();

const PADDED_FROM = "2026-07-01";

export function siteFrame(uid: string, through?: string): Point[] {
  return ROWS.filter((r) => r.unique_id === uid)
    .filter((r) => !through || r.timeperiod <= through)
    .sort((a, b) => a.timeperiod.localeCompare(b.timeperiod))
    .map((r) => ({
      t: r.timeperiod,
      sales: r.apheresis_sales,
      enrollments: r.enrollments,
      holiday: r.holiday_days,
    }));
}

export function nationalFrame(through?: string, dropPadded = false): Point[] {
  const months = ALL_MONTHS.filter((t) => !through || t <= through).filter(
    (t) => !dropPadded || t < PADDED_FROM,
  );
  const byT = new Map<string, Point>();
  for (const t of months) {
    byT.set(t, { t, sales: 0, enrollments: 0, holiday: 0 });
  }
  for (const r of ROWS) {
    const p = byT.get(r.timeperiod);
    if (!p) continue;
    p.sales += r.apheresis_sales;
    p.enrollments += r.enrollments;
    p.holiday += r.holiday_days;
  }
  return months.map((t) => byT.get(t)!);
}

export function actualsFor(uids: string[], months: string[]): number[][] {
  return uids.map((uid) => {
    const map = new Map(
      ROWS.filter((r) => r.unique_id === uid).map((r) => [
        r.timeperiod,
        r.apheresis_sales,
      ]),
    );
    return months.map((t) => map.get(t) ?? 0);
  });
}

export function lastTrainMonth(origin: string): string {
  return origin;
}

export function forecastMonths(origin: string, skip: number, horizon: number): string[] {
  const start = addMonths(origin, skip + 1);
  return Array.from({ length: horizon }, (_, i) => addMonths(start, i));
}

export function walkMonths(origin: string, skip: number, horizon: number): string[] {
  const n = skip + horizon;
  return Array.from({ length: n }, (_, i) => addMonths(origin, i + 1));
}

export { SITES };
