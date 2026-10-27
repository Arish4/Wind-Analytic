from dataclasses import dataclass
from datetime import date, timedelta

from forecasting.domain.delivery import DecisionPolicy, DeliveryPeriod, UK_TZ, delivery_day_of
from forecasting.domain.entities import ForecastComparison
from forecasting.domain.forecast_selection import compare, select_decision_forecasts
from forecasting.domain.horizon import HORIZON_BUCKETS, MAX_HORIZON_HOURS, HorizonBucket, bucket_for
from forecasting.domain.metrics import ErrorSummary, summarise, summarise_by

from .ports import ActualGenerationSource, ForecastSource

# Forecasts look up to 72h ahead, so earlier publications can still cover the period.
FORECAST_LOOKBACK = timedelta(hours=MAX_HORIZON_HOURS)


@dataclass(frozen=True)
class DayAheadReport:
    period: DeliveryPeriod
    policy: DecisionPolicy
    points: list[ForecastComparison]
    overall: ErrorSummary | None
    by_hour_of_day: dict[int, ErrorSummary]
    by_delivery_day: dict[date, ErrorSummary]


@dataclass(frozen=True)
class HorizonAccuracy:
    bucket: HorizonBucket
    summary: ErrorSummary | None


@dataclass(frozen=True)
class HorizonReport:
    period: DeliveryPeriod
    buckets: list[HorizonAccuracy]


class BuildDayAheadReport:
    """The forecast the team had at decision time, compared with what happened."""

    def __init__(self, actuals: ActualGenerationSource, forecasts: ForecastSource) -> None:
        self._actuals = actuals
        self._forecasts = forecasts

    def execute(self, period: DeliveryPeriod, policy: DecisionPolicy) -> DayAheadReport:
        forecasts = self._forecasts.fetch(
            policy.deadline_for(period.first_day) - FORECAST_LOOKBACK,
            policy.deadline_for(period.last_day),
        )
        actuals = self._actuals.fetch(period.starts_at, period.ends_at)

        selected = select_decision_forecasts(forecasts, period, policy)
        points = compare(selected.values(), actuals)

        return DayAheadReport(
            period=period,
            policy=policy,
            points=points,
            overall=summarise(points),
            by_hour_of_day=summarise_by(points, lambda p: p.start_time.astimezone(UK_TZ).hour),
            by_delivery_day=summarise_by(points, lambda p: delivery_day_of(p.start_time)),
        )


class BuildHorizonReport:
    """How forecast accuracy changes with lead time, using every published forecast."""

    def __init__(self, actuals: ActualGenerationSource, forecasts: ForecastSource) -> None:
        self._actuals = actuals
        self._forecasts = forecasts

    def execute(self, period: DeliveryPeriod) -> HorizonReport:
        forecasts = self._forecasts.fetch(period.starts_at - FORECAST_LOOKBACK, period.ends_at)
        actuals = self._actuals.fetch(period.starts_at, period.ends_at)

        in_period = [f for f in forecasts if period.contains(f.start_time)]
        comparisons = compare(in_period, actuals)
        by_bucket = summarise_by(
            [c for c in comparisons if bucket_for(c.horizon_hours)],
            lambda c: bucket_for(c.horizon_hours).max_hours,
        )

        return HorizonReport(
            period=period,
            buckets=[HorizonAccuracy(b, by_bucket.get(b.max_hours)) for b in HORIZON_BUCKETS],
        )
