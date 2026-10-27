// Port: what the application needs from a data provider. Infrastructure implements it.
import type { DayAheadReport, HorizonReport, Period, PilotMeta, ReportQuery } from "../domain/models";

export interface ForecastGateway {
  getMeta(): Promise<PilotMeta>;
  getDayAheadReport(query: ReportQuery): Promise<DayAheadReport>;
  getHorizonReport(period: Period): Promise<HorizonReport>;
}
