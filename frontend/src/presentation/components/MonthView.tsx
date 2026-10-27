import type { ForecastDashboard } from "../../application/useCases";
import { ChartLegend } from "./ChartLegend";
import { DailySection } from "./DailySection";
import { ForecastChart } from "./ForecastChart";
import { HorizonSection } from "./HorizonSection";
import { InsightsSection } from "./InsightsSection";
import { KpiGrid } from "./KpiGrid";

interface MonthViewProps {
  data: ForecastDashboard;
  onSelectDay: (day: string) => void;
}

export function MonthView({ data, onSelectDay }: MonthViewProps) {
  const { dayAhead, horizon } = data;

  return (
    <div className="stack">
      <section className="panel" id="month">
        <div className="section-head">
          <div>
            <p className="eyebrow">Whole pilot · decided by {dayAhead.cutoff} the day before</p>
            <h2>How good were the forecasts?</h2>
          </div>
          <ChartLegend showRange={false} />
        </div>
        {dayAhead.summary ? (
          <>
            <KpiGrid summary={dayAhead.summary} />
            <ForecastChart points={dayAhead.points} singleDay={false} />
          </>
        ) : (
          <p className="empty">No forecast was published before this cutoff. Try a later decision time.</p>
        )}
      </section>
      <InsightsSection report={dayAhead} />
      <DailySection rows={dayAhead.byDeliveryDay} onSelectDay={onSelectDay} />
      <HorizonSection report={horizon} />
    </div>
  );
}
