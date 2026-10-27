// Domain models: plain types the rest of the app speaks. No React, no HTTP.

export interface Period {
  start: string; // YYYY-MM-DD, UK delivery day
  end: string;
}

export interface ErrorSummary {
  sampleCount: number;
  maeMw: number;
  rmseMw: number;
  biasMw: number;
  p10ErrorMw: number;
  p50ErrorMw: number;
  p90ErrorMw: number;
  maxAbsErrorMw: number;
  meanActualMw: number;
  nmaePct: number;
}

export interface ComparisonPoint {
  startTime: Date;
  publishTime: Date;
  forecastMw: number;
  actualMw: number;
  errorMw: number; // forecast - actual: positive means less wind came than planned
  horizonHours: number;
}

export interface HourlyAccuracy extends ErrorSummary {
  hour: number;
}

export interface DailyAccuracy extends ErrorSummary {
  day: string;
}

export interface DayAheadReport {
  period: Period;
  cutoff: string;
  summary: ErrorSummary | null;
  points: ComparisonPoint[];
  byHourOfDay: HourlyAccuracy[];
  byDeliveryDay: DailyAccuracy[];
}

export interface HorizonAccuracy {
  label: string;
  minHours: number;
  maxHours: number;
  summary: ErrorSummary | null;
}

export interface HorizonReport {
  period: Period;
  buckets: HorizonAccuracy[];
}

export interface PilotMeta {
  period: Period;
  defaultCutoff: string;
  timezone: string;
}

export interface ReportQuery {
  period: Period;
  cutoff: string; // HH:MM, UK time on the day before delivery
}
