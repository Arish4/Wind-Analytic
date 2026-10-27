import type { ErrorSummary } from "../../domain/models";
import { shortfallBufferMw } from "../../domain/insights";
import { formatGw, formatSignedGw } from "../format";
import { StatCard } from "./StatCard";

export function KpiGrid({ summary }: { summary: ErrorSummary }) {
  return (
    <div className="stat-grid">
      <StatCard label="Typical miss" value={formatGw(summary.maeMw, 2)} hint={`Per hour · ${summary.nmaePct.toFixed(0)}% of output (MAE)`} />
      <StatCard label="Big-miss score" value={formatGw(summary.rmseMw, 2)} hint="Weighs large misses more (RMSE)" />
      <StatCard
        label="Forecast leaning"
        value={formatSignedGw(summary.biasMw)}
        hint={summary.biasMw > 0 ? "Forecast usually too high (bias)" : "Forecast usually too low (bias)"}
        tone={summary.biasMw > 0 ? "over" : "under"}
      />
      <StatCard label="Safety buffer" value={formatGw(shortfallBufferMw(summary))} hint="Covers 9 in 10 hours of shortfall (P90)" />
    </div>
  );
}
