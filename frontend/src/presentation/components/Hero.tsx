import type { DaySnapshot } from "../../domain/daySnapshot";
import { reliableWindMw } from "../../domain/insights";
import type { ErrorSummary } from "../../domain/models";
import { formatDateTime, formatDay, formatGw } from "../format";
import "./Hero.css";

interface HeroProps {
  snapshot?: DaySnapshot;
  pilotSummary?: ErrorSummary | null;
  cutoff: string;
}

const STEPS = ["Pick a delivery day", "Set when you decide", "Read the forecast and how far to trust it"];

export function Hero({ snapshot, pilotSummary, cutoff }: HeroProps) {
  return (
    <section className="hero" id="top">
      <span className="hero__wordmark" aria-hidden="true">WINDCAST</span>

      <div className="hero__intro">
        <p className="eyebrow">Day-ahead wind desk · Jan 2026 pilot</p>
        <h1>
          Know tomorrow's wind.
          <br />
          <span>And how far to trust it.</span>
        </h1>
        <p className="hero__lead">
          See the wind forecast you actually had when you placed your day-ahead order, next to what the
          turbines delivered and how big the miss usually is.
        </p>
        <ol className="hero__steps">
          {STEPS.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="hero__visual">
        <DecisionCard snapshot={snapshot} pilotSummary={pilotSummary} cutoff={cutoff} />
      </div>
    </section>
  );
}

function DecisionCard({ snapshot, pilotSummary, cutoff }: HeroProps) {
  const hasData = snapshot && snapshot.points.length > 0;

  return (
    <article className="decision-card" aria-live="polite">
      <header>
        <span>DELIVERY</span>
        <strong>{snapshot ? formatDay(snapshot.day) : "—"}</strong>
      </header>

      {hasData ? (
        <>
          <p className="decision-card__label">Forecast you had</p>
          <p className="decision-card__value">{formatGw(snapshot.meanForecastMw)}</p>
          <p className="decision-card__note">average over the day</p>

          {pilotSummary && (
            <div className="decision-card__rely">
              <span>Safe to count on</span>
              <strong>{formatGw(reliableWindMw(snapshot.meanForecastMw, pilotSummary))}</strong>
              <small>covers 9 in 10 hours</small>
            </div>
          )}

          <footer>
            <span>
              Forecast published {snapshot.publishedAt ? formatDateTime(snapshot.publishedAt) : "—"} (day before)
            </span>
            <span>
              What happened: <b>{formatGw(snapshot.meanActualMw)}</b>
            </span>
          </footer>
        </>
      ) : (
        <p className="decision-card__empty">
          {snapshot ? `No forecast was published before ${cutoff} the day before.` : "Loading forecast…"}
        </p>
      )}
    </article>
  );
}
