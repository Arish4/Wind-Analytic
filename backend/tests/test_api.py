from django.test import SimpleTestCase

from forecasting.application.ports import DataSourceUnavailable
from forecasting.container import Container, set_container
from forecasting.domain.entities import ActualGeneration, GenerationForecast

from .fakes import FakeActualSource, FakeForecastSource, utc


class FailingForecastSource:
    def fetch(self, published_from, published_to):
        raise DataSourceUnavailable("down")


class ApiTests(SimpleTestCase):
    def setUp(self):
        actuals = [ActualGeneration(utc(2026, 1, 15, h), 10_000) for h in range(24)]
        forecasts = [GenerationForecast(utc(2026, 1, 15, h), utc(2026, 1, 14, 7, 30), 11_000) for h in range(24)]
        set_container(Container(FakeActualSource(actuals), FakeForecastSource(forecasts)))

    def tearDown(self):
        set_container(None)

    def test_day_ahead_report(self):
        response = self.client.get("/api/reports/day-ahead", {"start": "2026-01-15", "end": "2026-01-15"})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body["points"]), 24)
        self.assertEqual(body["summary"]["bias_mw"], 1000)
        self.assertEqual(body["cutoff"], "09:00")
        self.assertEqual(len(body["by_hour_of_day"]), 24)

    def test_cutoff_before_any_forecast_gives_empty_report(self):
        response = self.client.get(
            "/api/reports/day-ahead", {"start": "2026-01-15", "end": "2026-01-15", "cutoff": "06:00"}
        )
        self.assertEqual(response.json()["summary"], None)

    def test_horizon_report(self):
        response = self.client.get("/api/reports/horizon", {"start": "2026-01-15", "end": "2026-01-15"})
        buckets = {b["label"]: b["summary"] for b in response.json()["buckets"]}
        self.assertEqual(buckets["12-24h"]["sample_count"], 8)  # 00:00-07:00 targets are 16.5-23.5h ahead
        self.assertIsNone(buckets["0-6h"])

    def test_rejects_dates_outside_pilot(self):
        response = self.client.get("/api/reports/day-ahead", {"start": "2025-12-01", "end": "2026-01-05"})
        self.assertEqual(response.status_code, 400)

    def test_rejects_bad_cutoff(self):
        response = self.client.get("/api/reports/day-ahead", {"cutoff": "9am"})
        self.assertEqual(response.status_code, 400)

    def test_upstream_failure_returns_503(self):
        set_container(Container(FakeActualSource([]), FailingForecastSource()))
        response = self.client.get("/api/reports/day-ahead")
        self.assertEqual(response.status_code, 503)

    def test_meta(self):
        body = self.client.get("/api/meta").json()
        self.assertEqual(body["period"], {"start": "2026-01-02", "end": "2026-02-01"})
