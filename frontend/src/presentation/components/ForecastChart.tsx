import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { likelyRangeMw } from "../../domain/insights";
import type { ComparisonPoint, ErrorSummary } from "../../domain/models";
import { formatDateTime, formatGw, formatShortDate, formatTime } from "../format";
import { CHART } from "./chartTheme";

interface Row {
  time: number;
  actual: number;
  forecast: number;
  error: number;
  published: Date;
  range?: [number, number];
}

interface ForecastChartProps {
  points: ComparisonPoint[];
  singleDay: boolean;
  /** When given, shades where the actual is likely to land (80% of hours). */
  rangeFrom?: ErrorSummary | null;
}

function ForecastTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  const missedLow = row.error > 0;
  return (
    <div className="tooltip">
      <strong>{formatDateTime(new Date(row.time))}</strong>
      <span>Forecast · {formatGw(row.forecast, 2)}</span>
      <span>Actual · {formatGw(row.actual, 2)}</span>
      <span className={missedLow ? "is-over" : "is-under"}>
        {formatGw(Math.abs(row.error), 2)} {missedLow ? "less wind than forecast" : "more wind than forecast"}
      </span>
      <small>Forecast published {formatDateTime(row.published)}</small>
    </div>
  );
}

export function ForecastChart({ points, singleDay, rangeFrom }: ForecastChartProps) {
  const rows: Row[] = points.map((p) => ({
    time: p.startTime.getTime(),
    actual: p.actualMw,
    forecast: p.forecastMw,
    error: p.errorMw,
    published: p.publishTime,
    range: rangeFrom ? likelyRangeMw(p.forecastMw, rangeFrom) : undefined,
  }));
  const formatTick = (time: number) => (singleDay ? formatTime(new Date(time)) : formatShortDate(new Date(time)));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART.blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatTick}
          minTickGap={40}
          tick={CHART.tick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={(mw: number) => `${(mw / 1000).toFixed(0)} GW`} tick={CHART.tick} axisLine={false} tickLine={false} width={64} />
        <Tooltip content={<ForecastTooltip />} />
        {rangeFrom && (
          <Area dataKey="range" type="monotone" stroke="none" fill={CHART.range} isAnimationActive={false} />
        )}
        <Area dataKey="actual" type="monotone" stroke={CHART.blue} strokeWidth={2.5} fill="url(#actualFill)" isAnimationActive={false} />
        <Line dataKey="forecast" type="monotone" stroke={CHART.navy} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
