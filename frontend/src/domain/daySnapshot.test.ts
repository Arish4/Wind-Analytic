import { describe, expect, it } from "vitest";
import { snapshotForDay } from "./daySnapshot";
import { accuracyGrade, likelyRangeMw, reliableWindMw } from "./insights";
import type { DayAheadReport, ErrorSummary } from "./models";

const summary: ErrorSummary = {
  sampleCount: 2,
  maeMw: 1000,
  rmseMw: 1000,
  biasMw: 1000,
  p10ErrorMw: -400,
  p50ErrorMw: 1000,
  p90ErrorMw: 1500,
  maxAbsErrorMw: 1000,
  meanActualMw: 9000,
  nmaePct: 11,
};

const point = (iso: string, forecastMw: number, actualMw: number, published: string) => ({
  startTime: new Date(iso),
  publishTime: new Date(published),
  forecastMw,
  actualMw,
  errorMw: forecastMw - actualMw,
  horizonHours: 20,
});

const report: DayAheadReport = {
  period: { start: "2026-01-15", end: "2026-01-16" },
  cutoff: "09:00",
  summary,
  points: [
    point("2026-01-15T00:00:00Z", 10000, 9000, "2026-01-14T07:30:00Z"),
    point("2026-01-15T23:00:00Z", 12000, 11000, "2026-01-14T07:30:00Z"),
    point("2026-01-16T00:00:00Z", 5000, 5000, "2026-01-15T07:30:00Z"),
  ],
  byHourOfDay: [],
  byDeliveryDay: [{ day: "2026-01-15", ...summary }],
};

describe("snapshotForDay", () => {
  it("keeps only the hours of that UK delivery day", () => {
    const snapshot = snapshotForDay(report, "2026-01-15");
    expect(snapshot.points).toHaveLength(2);
    expect(snapshot.meanForecastMw).toBe(11000);
    expect(snapshot.meanActualMw).toBe(10000);
    expect(snapshot.summary?.maeMw).toBe(1000);
    expect(snapshot.publishedAt?.toISOString()).toBe("2026-01-14T07:30:00.000Z");
  });

  it("is empty for a day without data", () => {
    const snapshot = snapshotForDay(report, "2026-01-20");
    expect(snapshot.points).toHaveLength(0);
    expect(snapshot.summary).toBeNull();
    expect(snapshot.publishedAt).toBeNull();
  });
});

describe("day-level insights", () => {
  it("derives reliable wind and the likely range from past errors", () => {
    expect(reliableWindMw(10000, summary)).toBe(8500);
    expect(likelyRangeMw(10000, summary)).toEqual([8500, 10400]);
  });

  it("grades accuracy", () => {
    expect(accuracyGrade(900)).toBe("good");
    expect(accuracyGrade(2000)).toBe("fair");
    expect(accuracyGrade(3000)).toBe("poor");
  });
});
