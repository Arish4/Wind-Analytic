import { previousDay } from "../../domain/dates";
import type { DaySnapshot } from "../../domain/daySnapshot";
import type { ErrorSummary } from "../../domain/models";
import { formatDay, formatGw } from "../format";
import { ChartLegend } from "./ChartLegend";
import { ForecastChart } from "./ForecastChart";
import { StatCard } from "./StatCard";

interface DayViewProps {
  snapshot: DaySnapshot;
  pilotSummary: ErrorSummary | null;
  cutoff: string;
}

function storyOf({ meanForecastMw, meanActualMw }: DaySnapshot): string {
  const gap = meanForecastMw - meanActualMw;
  const direction = gap > 0 ? "less" : "more";
  return `The forecast averaged ${formatGw(meanForecastMw)}. The wind actually delivered ${formatGw(meanActualMw)}, which is ${formatGw(Math.abs(gap))} ${direction} than planned.`;
}

export function DayView({ snapshot, pilotSummary, cutoff }: DayViewProps) {
  const { summary } = snapshot;

  return (
    <section className="panel" id="day">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            Power used {formatDay(snapshot.day)} · bought the day before ({formatDay(previousDay(snapshot.day))}, by {cutoff})
          </p>
          <h2>Forecast vs what happened</h2>
        </div>
        <ChartLegend showRange={Boolean(pilotSummary)} />
      </div>

      {summary ? (
        <>
          <p className="story">{storyOf(snapshot)}</p>
          <div className="stat-grid stat-grid--3">
            <StatCard
              label="Typical miss"
              value={formatGw(summary.maeMw, 2)}
              hint="Average gap per hour (MAE)"
            />
            <StatCard
              label="Biggest miss"
              value={formatGw(summary.maxAbsErrorMw, 2)}
              hint="Worst single hour of the day"
            />
            <StatCard
              label={summary.biasMw > 0 ? "Wind came in lower" : "Wind came in higher"}
              value={formatGw(Math.abs(summary.biasMw), 2)}
              hint="Average gap, forecast vs actual (bias)"
              tone={summary.biasMw > 0 ? "over" : "under"}
            />
          </div>
          <ForecastChart points={snapshot.points} singleDay rangeFrom={pilotSummary} />
          <p className="footnote">
            The shaded band shows where actual wind landed in 8 of 10 hours across the whole pilot, given the forecast.
            Hover the chart for hour-by-hour detail.
          </p>
        </>
      ) : (
        <p className="empty">No forecast was published before {cutoff} the day before. Try a later decision time.</p>
      )}
    </section>
  );
}
