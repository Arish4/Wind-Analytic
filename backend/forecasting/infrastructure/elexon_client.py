import logging

import requests

from forecasting.application.ports import DataSourceUnavailable

logger = logging.getLogger(__name__)


class ElexonClient:
    """Thin HTTP wrapper around the Elexon BMRS dataset stream endpoints."""

    def __init__(self, base_url: str, timeout_seconds: int, session: requests.Session | None = None) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds
        self._session = session or requests.Session()

    def stream(self, dataset: str, params: dict[str, str]) -> list[dict]:
        url = f"{self._base_url}/datasets/{dataset}/stream"
        logger.info("Fetching %s %s", dataset, params)
        try:
            response = self._session.get(url, params=params, timeout=self._timeout)
            response.raise_for_status()
            rows = response.json()
        except (requests.RequestException, ValueError) as error:
            raise DataSourceUnavailable(f"Elexon {dataset} request failed: {error}") from error

        if not isinstance(rows, list):
            raise DataSourceUnavailable(f"Elexon {dataset} returned an unexpected payload")
        return rows
