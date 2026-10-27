import { describe, expect, it, vi } from "vitest";
import type { DayAheadReport, HorizonReport } from "../domain/models";
import type { ForecastGateway } from "./ForecastGateway";
import { LoadForecastDashboard } from "./useCases";

const period = { start: "2026-01-15", end: "2026-01-15" };

function fakeGateway(): ForecastGateway {
  const dayAhead: DayAheadReport = { period, cutoff: "09:00", summary: null, points: [], byHourOfDay: [], byDeliveryDay: [] };
  const horizon: HorizonReport = { period, buckets: [] };
  return {
    getMeta: vi.fn(),
    getDayAheadReport: vi.fn().mockResolvedValue(dayAhead),
    getHorizonReport: vi.fn().mockResolvedValue(horizon),
  };
}

describe("LoadForecastDashboard", () => {
  it("loads both reports for the same period", async () => {
    const gateway = fakeGateway();
    const result = await new LoadForecastDashboard(gateway).execute({ period, cutoff: "10:00" });

    expect(gateway.getDayAheadReport).toHaveBeenCalledWith({ period, cutoff: "10:00" });
    expect(gateway.getHorizonReport).toHaveBeenCalledWith(period);
    expect(result.dayAhead.cutoff).toBe("09:00");
    expect(result.horizon.buckets).toEqual([]);
  });
});
