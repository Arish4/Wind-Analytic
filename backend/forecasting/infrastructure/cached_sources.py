"""Caching decorators: wrap any source without changing it (open/closed)."""
from datetime import datetime

from django.core.cache import BaseCache

from forecasting.application.ports import ActualGenerationSource, ForecastSource
from forecasting.domain.entities import ActualGeneration, GenerationForecast


class CachedActualGenerationSource:
    def __init__(self, inner: ActualGenerationSource, cache: BaseCache, ttl_seconds: int) -> None:
        self._inner = inner
        self._cache = cache
        self._ttl = ttl_seconds

    def fetch(self, starts_at: datetime, ends_at: datetime) -> list[ActualGeneration]:
        key = f"actuals:{starts_at.isoformat()}:{ends_at.isoformat()}"
        return self._cache.get_or_set(key, lambda: self._inner.fetch(starts_at, ends_at), self._ttl)


class CachedForecastSource:
    def __init__(self, inner: ForecastSource, cache: BaseCache, ttl_seconds: int) -> None:
        self._inner = inner
        self._cache = cache
        self._ttl = ttl_seconds

    def fetch(self, published_from: datetime, published_to: datetime) -> list[GenerationForecast]:
        key = f"forecasts:{published_from.isoformat()}:{published_to.isoformat()}"
        return self._cache.get_or_set(key, lambda: self._inner.fetch(published_from, published_to), self._ttl)
