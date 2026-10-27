import { accuracyGrade } from "../../domain/insights";
import type { DailyAccuracy } from "../../domain/models";
import { formatDay, formatGw } from "../format";
import "./Toolbar.css";

export type View = "day" | "month";

// Elexon publishes WINDFOR around 02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30 and 22:30.
const CUTOFF_OPTIONS = ["05:00", "08:00", "09:00", "10:00", "12:00", "16:00"];

const VIEWS: { id: View; label: string }[] = [
  { id: "day", label: "Day view" },
  { id: "month", label: "Month report" },
];

interface ToolbarProps {
  view: View;
  days: string[];
  day: string;
  daily: DailyAccuracy[];
  cutoff: string;
  loading: boolean;
  onViewChange: (view: View) => void;
  onDayChange: (day: string) => void;
  onCutoffChange: (cutoff: string) => void;
}

export function Toolbar(props: ToolbarProps) {
  const { view, days, day, daily, cutoff, loading, onViewChange, onDayChange, onCutoffChange } = props;
  const dailyByDay = new Map(daily.map((row) => [row.day, row]));

  return (
    <section className="toolbar" aria-label="Report controls">
      <div className="toolbar__row">
        <div className="segmented" role="tablist">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              role="tab"
              aria-selected={view === option.id}
              className={view === option.id ? "is-active" : ""}
              onClick={() => onViewChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="toolbar__cutoff">
          <span>I decide by (day before)</span>
          <div className="segmented segmented--small">
            {CUTOFF_OPTIONS.map((option) => (
              <button key={option} className={cutoff === option ? "is-active" : ""} onClick={() => onCutoffChange(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar__days-head">
        <span>Delivery day</span>
        <span className="toolbar__legend">
          <i className="dot dot--good" /> small miss <i className="dot dot--fair" /> medium <i className="dot dot--poor" /> large
          {loading && <em>· updating…</em>}
        </span>
      </div>

      <div className="day-strip" role="listbox" aria-label="Delivery day">
        {days.map((d) => {
          const row = dailyByDay.get(d);
          const [weekday, date] = formatDay(d).split(" ");
          return (
            <button
              key={d}
              role="option"
              aria-selected={view === "day" && d === day}
              className={`day-chip ${view === "day" && d === day ? "is-active" : ""}`}
              title={row ? `${formatDay(d)} · typical miss ${formatGw(row.maeMw, 1)}` : formatDay(d)}
              onClick={() => onDayChange(d)}
            >
              <span>{weekday}</span>
              <strong>{date}</strong>
              <i className={`dot ${row ? `dot--${accuracyGrade(row.maeMw)}` : ""}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
