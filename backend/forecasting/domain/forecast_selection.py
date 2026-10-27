"""Which forecast would the trader actually have seen when deciding?"""
from collections.abc import Iterable
from datetime import datetime

from .delivery import DecisionPolicy, DeliveryPeriod, delivery_day_of
from .entities import ActualGeneration, ForecastComparison, GenerationForecast


def select_decision_forecasts(
    forecasts: Iterable[GenerationForecast],
    period: DeliveryPeriod,
    policy: DecisionPolicy,
) -> dict[datetime, GenerationForecast]:
    """For each target hour, keep the newest forecast published before that day's deadline."""
    chosen: dict[datetime, GenerationForecast] = {}
    for forecast in forecasts:
        if not period.contains(forecast.start_time):
            continue
        deadline = policy.deadline_for(delivery_day_of(forecast.start_time))
        if forecast.publish_time > deadline:
            continue
        current = chosen.get(forecast.start_time)
        if current is None or forecast.publish_time > current.publish_time:
            chosen[forecast.start_time] = forecast
    return chosen


def compare(
    forecasts: Iterable[GenerationForecast],
    actuals: Iterable[ActualGeneration],
) -> list[ForecastComparison]:
    """Pair forecasts with actuals at the same start time; unmatched rows are dropped."""
    actual_by_time = {actual.start_time: actual.generation_mw for actual in actuals}
    comparisons = [
        ForecastComparison(
            start_time=forecast.start_time,
            publish_time=forecast.publish_time,
            forecast_mw=forecast.generation_mw,
            actual_mw=actual_by_time[forecast.start_time],
        )
        for forecast in forecasts
        if forecast.start_time in actual_by_time
    ]
    return sorted(comparisons, key=lambda c: (c.start_time, c.publish_time))
