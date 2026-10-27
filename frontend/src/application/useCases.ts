import type { DayAheadReport, HorizonReport, PilotMeta, ReportQuery } from "../domain/models";
import type { ForecastGateway } from "./ForecastGateway";

export interface ForecastDashboard {
  dayAhead: DayAheadReport;
  horizon: HorizonReport;
}

export class LoadPilotMeta {
  constructor(private readonly gateway: ForecastGateway) {}

  execute(): Promise<PilotMeta> {
    return this.gateway.getMeta();
  }
}

export class LoadForecastDashboard {
  constructor(private readonly gateway: ForecastGateway) {}

  async execute(query: ReportQuery): Promise<ForecastDashboard> {
    const [dayAhead, horizon] = await Promise.all([
      this.gateway.getDayAheadReport(query),
      this.gateway.getHorizonReport(query.period),
    ]);
    return { dayAhead, horizon };
  }
}
