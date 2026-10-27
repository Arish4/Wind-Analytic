from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class ActualGeneration:
    """Metered national wind output for one settlement period."""

    start_time: datetime
    generation_mw: float


@dataclass(frozen=True)
class GenerationForecast:
    """One forecast value for one target hour, as published at publish_time."""

    start_time: datetime
    publish_time: datetime
    generation_mw: float

    @property
    def horizon_hours(self) -> float:
        return (self.start_time - self.publish_time).total_seconds() / 3600


@dataclass(frozen=True)
class ForecastComparison:
    """A forecast placed next to what actually happened."""

    start_time: datetime
    publish_time: datetime
    forecast_mw: float
    actual_mw: float

    @property
    def error_mw(self) -> float:
        """Positive means the forecast was too high: less wind came than planned."""
        return self.forecast_mw - self.actual_mw

    @property
    def horizon_hours(self) -> float:
        return (self.start_time - self.publish_time).total_seconds() / 3600
