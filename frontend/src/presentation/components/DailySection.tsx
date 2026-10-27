import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyAccuracy } from "../../domain/models";
import { formatDay, formatGw, formatSignedGw } from "../format";
import { CHART } from "./chartTheme";

interface DailySectionProps {
  rows: DailyAccuracy[];
  onSelectDay: (day: string) => void;
}

export function DailySection({ rows, onSelectDay }: DailySectionProps) {
  if (rows.length < 2) return null;

  return (
    <section className="panel" id="daily">
      <div className="section-head">
        <div>
          <p className="eyebrow">Day by day</p>
          <h2>Where the forecast missed</h2>
        </div>
        <p className="section-lead">
          Average miss per delivery day. <span className="tag tag--over">Orange</span> = wind under-delivered,{" "}
          <span className="tag tag--under">teal</span> = wind over-delivered. Click a bar to open that day.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} tick={CHART.tick} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis tickFormatter={(mw: number) => `${(mw / 1000).toFixed(0)} GW`} tick={CHART.tick} axisLine={false} tickLine={false} width={52} />
          <ReferenceLine y={0} stroke={CHART.navy} strokeOpacity={0.3} />
          <Tooltip
            cursor={{ fill: "rgba(10,26,63,0.04)" }}
            labelFormatter={(day: string) => formatDay(day)}
            formatter={(mw: number, _name, item) => [
              `${formatSignedGw(mw)} bias · ${formatGw((item.payload as DailyAccuracy).maeMw, 2)} MAE`,
              "Miss",
            ]}
          />
          <Bar
            dataKey="biasMw"
            radius={[6, 6, 6, 6]}
            isAnimationActive={false}
            cursor="pointer"
            onClick={(row: DailyAccuracy) => onSelectDay(row.day)}
          >
            {rows.map((row) => (
              <Cell key={row.day} fill={row.biasMw > 0 ? CHART.over : CHART.under} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
