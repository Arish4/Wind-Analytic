"""Interfaces the use cases depend on. Infrastructure provides the implementations."""
from datetime import datetime
from typing import Protocol

from forecasting.domain.entities import ActualGeneration, GenerationForecast


class DataSourceUnavailable(Exception):
    """The upstream data provider could not be reached or returned bad data."""


class ActualGenerationSource(Protocol):
    def fetch(self, starts_at: datetime, ends_at: datetime) -> list[ActualGeneration]:
        """Actual generation with start_time in [starts_at, ends_at)."""
        ...


class ForecastSource(Protocol):
    def fetch(self, published_from: datetime, published_to: datetime) -> list[GenerationForecast]:
        """Every forecast published in [published_from, published_to]."""
        ...
