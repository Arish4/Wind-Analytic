"""Elexon-backed implementations of the application ports."""
from datetime import datetime, timedelta, timezone

from forecasting.domain.entities import ActualGeneration, GenerationForecast

from .elexon_client import ElexonClient

WIND = "WIND"


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def to_utc_iso(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class ElexonActualGenerationSource:
    """FUELHH dataset, wind only."""

    def __init__(self, client: ElexonClient) -> None:
        self._client = client

    def fetch(self, starts_at: datetime, ends_at: datetime) -> list[ActualGeneration]:
        # Settlement dates are UK local days; widen by a day so no boundary period is missed.
        rows = self._client.stream("FUELHH", {
            "settlementDateFrom": (starts_at - timedelta(days=1)).date().isoformat(),
            "settlementDateTo": (ends_at + timedelta(days=1)).date().isoformat(),
            "fuelType": WIND,
        })
        points = (
            ActualGeneration(start_time=parse_time(row["startTime"]), generation_mw=float(row["generation"]))
            for row in rows
            if row.get("fuelType") == WIND
        )
        return sorted(
            (p for p in points if starts_at <= p.start_time < ends_at),
            key=lambda p: p.start_time,
        )


class ElexonForecastSource:
    """WINDFOR dataset: national wind forecasts with their publish time."""

    def __init__(self, client: ElexonClient) -> None:
        self._client = client

    def fetch(self, published_from: datetime, published_to: datetime) -> list[GenerationForecast]:
        rows = self._client.stream("WINDFOR", {
            "publishDateTimeFrom": to_utc_iso(published_from),
            "publishDateTimeTo": to_utc_iso(published_to),
        })
        return [
            GenerationForecast(
                start_time=parse_time(row["startTime"]),
                publish_time=parse_time(row["publishTime"]),
                generation_mw=float(row["generation"]),
            )
            for row in rows
        ]
