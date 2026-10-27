import { describe, expect, it } from "vitest";
import { biasDirection, freshnessGainPct, hardestHour, shortfallBufferMw } from "./insights";
import type { ErrorSummary } from "./models";

const summary = (overrides: Partial<ErrorSummary> = {}): ErrorSummary => ({
  sampleCount: 10,
  maeMw: 1000,
  rmseMw: 1200,
  biasMw: 0,
  p10ErrorMw: -500,
  p50ErrorMw: 0,
  p90ErrorMw: 800,
  maxAbsErrorMw: 2000,
  meanActualMw: 10000,
  nmaePct: 10,
  ...overrides,
});

describe("insights", () => {
  it("uses P90 error as the shortfall buffer, never negative", () => {
    expect(shortfallBufferMw(summary())).toBe(800);
    expect(shortfallBufferMw(summary({ p90ErrorMw: -50 }))).toBe(0);
  });

  it("reads bias direction with a tolerance", () => {
    expect(biasDirection(summary({ biasMw: 500 }))).toBe("over");
    expect(biasDirection(summary({ biasMw: -500 }))).toBe("under");
    expect(biasDirection(summary({ biasMw: 50 }))).toBe("balanced");
  });

  it("finds the hour with the largest MAE", () => {
    const rows = [
      { hour: 1, ...summary({ maeMw: 900 }) },
      { hour: 18, ...summary({ maeMw: 2400 }) },
    ];
    expect(hardestHour(rows)?.hour).toBe(18);
    expect(hardestHour([])).toBeUndefined();
  });

  it("compares freshest and oldest horizon buckets", () => {
    const buckets = [
      { label: "0-6h", minHours: 0, maxHours: 6, summary: summary({ maeMw: 1500 }) },
      { label: "6-12h", minHours: 6, maxHours: 12, summary: null },
      { label: "48-72h", minHours: 48, maxHours: 72, summary: summary({ maeMw: 2000 }) },
    ];
    expect(freshnessGainPct(buckets)).toBe(25);
    expect(freshnessGainPct(buckets.slice(0, 1))).toBeNull();
  });
});
