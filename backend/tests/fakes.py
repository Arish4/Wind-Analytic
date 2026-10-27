"""In-memory sources that honour the same ports as the Elexon ones."""
from datetime import datetime, timezone

from forecasting.domain.entities import ActualGeneration, GenerationForecast


def utc(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> datetime:
    return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)


class FakeActualSource:
    def __init__(self, points: list[ActualGeneration]) -> None:
        self.points = points

    def fetch(self, starts_at: datetime, ends_at: datetime) -> list[ActualGeneration]:
        return [p for p in self.points if starts_at <= p.start_time < ends_at]


class FakeForecastSource:
    def __init__(self, forecasts: list[GenerationForecast]) -> None:
        self.forecasts = forecasts

    def fetch(self, published_from: datetime, published_to: datetime) -> list[GenerationForecast]:
        return [f for f in self.forecasts if published_from <= f.publish_time <= published_to]
