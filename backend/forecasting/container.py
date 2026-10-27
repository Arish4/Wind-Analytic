"""Composition root: the only place that chooses concrete implementations."""
from django.conf import settings
from django.core.cache import cache

from forecasting.application.ports import ActualGenerationSource, ForecastSource
from forecasting.application.use_cases import BuildDayAheadReport, BuildHorizonReport
from forecasting.infrastructure.cached_sources import CachedActualGenerationSource, CachedForecastSource
from forecasting.infrastructure.elexon_client import ElexonClient
from forecasting.infrastructure.elexon_sources import ElexonActualGenerationSource, ElexonForecastSource


class Container:
    def __init__(self, actuals: ActualGenerationSource, forecasts: ForecastSource) -> None:
        self.day_ahead_report = BuildDayAheadReport(actuals, forecasts)
        self.horizon_report = BuildHorizonReport(actuals, forecasts)


def build_default_container() -> Container:
    client = ElexonClient(settings.ELEXON_BASE_URL, settings.ELEXON_TIMEOUT_SECONDS)
    ttl = settings.ELEXON_CACHE_SECONDS
    return Container(
        actuals=CachedActualGenerationSource(ElexonActualGenerationSource(client), cache, ttl),
        forecasts=CachedForecastSource(ElexonForecastSource(client), cache, ttl),
    )


_container: Container | None = None


def get_container() -> Container:
    global _container
    if _container is None:
        _container = build_default_container()
    return _container


def set_container(container: Container | None) -> None:
    """Swap the wiring, e.g. with in-memory fakes in tests."""
    global _container
    _container = container
