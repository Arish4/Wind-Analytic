// Everything the desk needs about one delivery day, cut out of the pilot report.
import { ukDay } from "./dates";
import type { ComparisonPoint, DayAheadReport, ErrorSummary } from "./models";

export interface DaySnapshot {
  day: string;
  points: ComparisonPoint[];
  summary: ErrorSummary | null;
  meanForecastMw: number;
  meanActualMw: number;
  publishedAt: Date | null; // newest forecast used for this day
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);

export function snapshotForDay(report: DayAheadReport, day: string): DaySnapshot {
  const points = report.points.filter((p) => ukDay(p.startTime) === day);
  const daily = report.byDeliveryDay.find((row) => row.day === day);
  const publishTimes = points.map((p) => p.publishTime.getTime());

  return {
    day,
    points,
    summary: daily ?? null,
    meanForecastMw: mean(points.map((p) => p.forecastMw)),
    meanActualMw: mean(points.map((p) => p.actualMw)),
    publishedAt: publishTimes.length ? new Date(Math.max(...publishTimes)) : null,
  };
}
