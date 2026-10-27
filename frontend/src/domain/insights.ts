// Business readings of the error statistics, written for a trading desk.
import type { ErrorSummary, HorizonAccuracy, HourlyAccuracy } from "./models";

/** Extra MW to hold so that a wind shortfall is covered in 90% of hours. */
export function shortfallBufferMw(summary: ErrorSummary): number {
  return Math.max(0, summary.p90ErrorMw);
}

/** Wind you can count on in 9 of 10 hours: the forecast minus the shortfall buffer. */
export function reliableWindMw(forecastMw: number, summary: ErrorSummary): number {
  return Math.max(0, forecastMw - shortfallBufferMw(summary));
}

/** Where the actual is likely to land (80% of hours), given past errors. Error = forecast - actual. */
export function likelyRangeMw(forecastMw: number, summary: ErrorSummary): [number, number] {
  return [Math.max(0, forecastMw - summary.p90ErrorMw), Math.max(0, forecastMw - summary.p10ErrorMw)];
}

export type BiasDirection = "over" | "under" | "balanced";

/** Forecasts that run high mean the desk under-buys. */
export function biasDirection(summary: ErrorSummary, toleranceMw = 100): BiasDirection {
  if (summary.biasMw > toleranceMw) return "over";
  if (summary.biasMw < -toleranceMw) return "under";
  return "balanced";
}

export type AccuracyGrade = "good" | "fair" | "poor";

/** Traffic-light grade for a typical hourly miss. */
export function accuracyGrade(maeMw: number): AccuracyGrade {
  if (maeMw < 1500) return "good";
  if (maeMw < 2500) return "fair";
  return "poor";
}

export function hardestHour(rows: HourlyAccuracy[]): HourlyAccuracy | undefined {
  return rows.reduce<HourlyAccuracy | undefined>(
    (worst, row) => (!worst || row.maeMw > worst.maeMw ? row : worst),
    undefined,
  );
}

/** How much smaller the error is for the freshest forecasts vs the oldest, in %. */
export function freshnessGainPct(buckets: HorizonAccuracy[]): number | null {
  const withData = buckets.filter((b) => b.summary);
  if (withData.length < 2) return null;
  const freshest = withData[0].summary!.maeMw;
  const oldest = withData[withData.length - 1].summary!.maeMw;
  return oldest > 0 ? Math.round((100 * (oldest - freshest)) / oldest) : null;
}
