// Adapter: the Django REST API behind the ForecastGateway port.
import type { ForecastGateway } from "../application/ForecastGateway";
import type {
  DayAheadReport,
  ErrorSummary,
  HorizonReport,
  Period,
  PilotMeta,
  ReportQuery,
} from "../domain/models";

type SummaryDto = {
  sample_count: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  p10_error_mw: number;
  p50_error_mw: number;
  p90_error_mw: number;
  max_abs_error_mw: number;
  mean_actual_mw: number;
  nmae_pct: number;
};

type PointDto = {
  start_time: string;
  publish_time: string;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
  horizon_hours: number;
};

type DayAheadDto = {
  period: Period;
  cutoff: string;
  summary: SummaryDto | null;
  points: PointDto[];
  by_hour_of_day: (SummaryDto & { hour: number })[];
  by_delivery_day: (SummaryDto & { day: string })[];
};

type HorizonDto = {
  period: Period;
  buckets: { label: string; min_hours: number; max_hours: number; summary: SummaryDto | null }[];
};

type MetaDto = { period: Period; default_cutoff: string; timezone: string };

export class ApiError extends Error {}

export function toSummary(dto: SummaryDto): ErrorSummary {
  return {
    sampleCount: dto.sample_count,
    maeMw: dto.mae_mw,
    rmseMw: dto.rmse_mw,
    biasMw: dto.bias_mw,
    p10ErrorMw: dto.p10_error_mw,
    p50ErrorMw: dto.p50_error_mw,
    p90ErrorMw: dto.p90_error_mw,
    maxAbsErrorMw: dto.max_abs_error_mw,
    meanActualMw: dto.mean_actual_mw,
    nmaePct: dto.nmae_pct,
  };
}

export class HttpForecastGateway implements ForecastGateway {
  constructor(private readonly baseUrl: string = "") {}

  async getMeta(): Promise<PilotMeta> {
    const dto = await this.get<MetaDto>("/api/meta");
    return { period: dto.period, defaultCutoff: dto.default_cutoff, timezone: dto.timezone };
  }

  async getDayAheadReport({ period, cutoff }: ReportQuery): Promise<DayAheadReport> {
    const dto = await this.get<DayAheadDto>("/api/reports/day-ahead", { ...period, cutoff });
    return {
      period: dto.period,
      cutoff: dto.cutoff,
      summary: dto.summary && toSummary(dto.summary),
      points: dto.points.map((p) => ({
        startTime: new Date(p.start_time),
        publishTime: new Date(p.publish_time),
        forecastMw: p.forecast_mw,
        actualMw: p.actual_mw,
        errorMw: p.error_mw,
        horizonHours: p.horizon_hours,
      })),
      byHourOfDay: dto.by_hour_of_day.map((row) => ({ hour: row.hour, ...toSummary(row) })),
      byDeliveryDay: dto.by_delivery_day.map((row) => ({ day: row.day, ...toSummary(row) })),
    };
  }

  async getHorizonReport(period: Period): Promise<HorizonReport> {
    const dto = await this.get<HorizonDto>("/api/reports/horizon", { ...period });
    return {
      period: dto.period,
      buckets: dto.buckets.map((b) => ({
        label: b.label,
        minHours: b.min_hours,
        maxHours: b.max_hours,
        summary: b.summary && toSummary(b.summary),
      })),
    };
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}${path}${query ? `?${query}` : ""}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(body.detail ?? `Request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  }
}
