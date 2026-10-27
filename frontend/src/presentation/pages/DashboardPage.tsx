import { useMemo, useState } from "react";
import { daysInPeriod } from "../../domain/dates";
import { snapshotForDay } from "../../domain/daySnapshot";
import type { PilotMeta } from "../../domain/models";
import { useDependencies } from "../dependencies";
import { useAsync } from "../hooks/useAsync";
import { DayView } from "../components/DayView";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { MonthView } from "../components/MonthView";
import { Navbar } from "../components/Navbar";
import { ErrorPanel, LoadingPanel } from "../components/StatusViews";
import { Toolbar, type View } from "../components/Toolbar";

export function DashboardPage() {
  const { loadMeta } = useDependencies();
  const [attempt, setAttempt] = useState(0);
  const meta = useAsync(() => loadMeta.execute(), [attempt]);

  return (
    <div className="page">
      <Navbar />
      {meta.status === "success" && <Dashboard meta={meta.data} />}
      {meta.status === "loading" && <LoadingPanel label="Connecting…" />}
      {meta.status === "error" && <ErrorPanel message={meta.error} onRetry={() => setAttempt((n) => n + 1)} />}
      <Footer />
    </div>
  );
}

function Dashboard({ meta }: { meta: PilotMeta }) {
  const { loadDashboard } = useDependencies();
  const days = useMemo(() => daysInPeriod(meta.period.start, meta.period.end), [meta]);
  const [view, setView] = useState<View>("day");
  const [day, setDay] = useState(days[0]);
  const [cutoff, setCutoff] = useState(meta.defaultCutoff);
  const [attempt, setAttempt] = useState(0);

  // The whole pilot is loaded once per cutoff; picking a day is instant and needs no request.
  const dashboard = useAsync(
    () => loadDashboard.execute({ period: meta.period, cutoff }),
    [meta, cutoff, attempt],
  );
  const data = dashboard.data;
  const snapshot = useMemo(() => (data ? snapshotForDay(data.dayAhead, day) : undefined), [data, day]);

  const openDay = (next: string) => {
    setDay(next);
    setView("day");
  };

  const openDayFromChart = (next: string) => {
    openDay(next);
    document.getElementById("controls")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="stack">
      <Hero snapshot={snapshot} pilotSummary={data?.dayAhead.summary} cutoff={cutoff} />

      <div id="controls">
        <Toolbar
          view={view}
          days={days}
          day={day}
          daily={data?.dayAhead.byDeliveryDay ?? []}
          cutoff={cutoff}
          loading={dashboard.status === "loading"}
          onViewChange={setView}
          onDayChange={openDay}
          onCutoffChange={setCutoff}
        />
      </div>

      {dashboard.status === "error" && (
        <ErrorPanel message={dashboard.error} onRetry={() => setAttempt((n) => n + 1)} />
      )}
      {!data && dashboard.status === "loading" && <LoadingPanel />}

      {data && snapshot && (
        <div className={dashboard.status === "loading" ? "is-stale" : ""}>
          {view === "day" ? (
            <DayView snapshot={snapshot} pilotSummary={data.dayAhead.summary} cutoff={cutoff} />
          ) : (
            <MonthView data={data} onSelectDay={openDayFromChart} />
          )}
        </div>
      )}
    </main>
  );
}
