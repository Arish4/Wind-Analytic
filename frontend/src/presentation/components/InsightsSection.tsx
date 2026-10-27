import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayAheadReport } from "../../domain/models";
import { biasDirection, hardestHour, shortfallBufferMw } from "../../domain/insights";
import { formatGw, formatHour, formatSignedGw } from "../format";
import { CHART } from "./chartTheme";

const BIAS_TEXT = {
  over: "Forecasts ran high: less wind arrived than planned, so the desk would have under-bought.",
  under: "Forecasts ran low: more wind arrived than planned, so the desk would have over-bought.",
  balanced: "Forecasts were well balanced: no systematic lean either way.",
};

export function InsightsSection({ report }: { report: DayAheadReport }) {
  const summary = report.summary;
  if (!summary) return null;
  const worst = hardestHour(report.byHourOfDay);

  const cards = [
    {
      value: formatGw(shortfallBufferMw(summary)),
      title: "Shortfall buffer",
      text: "Extra cover that would have protected 90% of hours against wind coming in below forecast.",
    },
    { value: formatSignedGw(summary.biasMw), title: "Systematic bias", text: BIAS_TEXT[biasDirection(summary)] },
    {
      value: worst ? formatHour(worst.hour) : "—",
      title: "Hardest hour",
      text: worst ? `Largest typical miss of the day: ${formatGw(worst.maeMw, 2)} MAE. Watch this block.` : "",
    },
  ];

  return (
    <section className="navy-panel" id="insights">
      <div className="section-head">
        <div>
          <p className="eyebrow eyebrow--light">Insights</p>
          <h2>Plan beyond the weather</h2>
        </div>
        <p className="section-lead">Error statistics turned into numbers a trading desk can act on.</p>
      </div>

      <div className="insight-cards">
        {cards.map((card) => (
          <article className="insight-card" key={card.title}>
            <strong>{card.value}</strong>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>

      <div className="glass-chart">
        <p className="eyebrow eyebrow--light">Error by hour of day · bars = MAE, line = bias</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={report.byHourOfDay} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART.gridDark} vertical={false} />
            <XAxis dataKey="hour" tickFormatter={formatHour} tick={CHART.tickDark} axisLine={false} tickLine={false} interval={2} />
            <YAxis tickFormatter={(mw: number) => `${(mw / 1000).toFixed(1)} GW`} tick={CHART.tickDark} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              labelFormatter={(hour: number) => formatHour(hour)}
              formatter={(mw: number, name: string) => [formatGw(mw, 2), name]}
            />
            <Bar dataKey="maeMw" name="MAE" fill={CHART.sky} radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Line dataKey="biasMw" name="Bias" stroke={CHART.over} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
