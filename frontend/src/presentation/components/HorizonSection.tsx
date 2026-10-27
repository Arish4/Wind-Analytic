import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HorizonReport } from "../../domain/models";
import { freshnessGainPct } from "../../domain/insights";
import { formatGw } from "../format";
import { CHART } from "./chartTheme";

const SHADES = ["#0a1a3f", "#16307a", "#1d4ed8", "#3b82f6", "#6d9cff", "#a9c4ff"];

export function HorizonSection({ report }: { report: HorizonReport }) {
  const rows = report.buckets
    .filter((bucket) => bucket.summary)
    .map((bucket) => ({ label: bucket.label, mae: bucket.summary!.maeMw, count: bucket.summary!.sampleCount }));
  const gain = freshnessGainPct(report.buckets);

  return (
    <section className="panel" id="lead-time">
      <div className="section-head">
        <div>
          <p className="eyebrow">Lead time</p>
          <h2>Fresher forecasts, smaller misses</h2>
        </div>
        <p className="section-lead">
          Every forecast published for these days, grouped by how far ahead it was made.
          {gain !== null && (
            <>
              {" "}The freshest forecasts miss <b>{gain}% less</b> than the oldest ones.
            </>
          )}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={CHART.tick} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(mw: number) => `${(mw / 1000).toFixed(1)} GW`} tick={CHART.tick} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            cursor={{ fill: "rgba(10,26,63,0.04)" }}
            formatter={(mw: number) => [formatGw(mw, 2), "MAE"]}
            labelFormatter={(label: string) => `${label} ahead`}
          />
          <Bar dataKey="mae" radius={[10, 10, 0, 0]} isAnimationActive={false}>
            {rows.map((row, index) => (
              <Cell key={row.label} fill={SHADES[index % SHADES.length]} />
            ))}
            <LabelList dataKey="mae" position="top" formatter={(mw: number) => formatGw(mw, 2)} className="bar-label" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
