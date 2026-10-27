from datetime import date, time
from unittest import TestCase

from forecasting.domain.delivery import DecisionPolicy, DeliveryPeriod, InvalidPeriodError
from forecasting.domain.entities import ActualGeneration, ForecastComparison, GenerationForecast
from forecasting.domain.forecast_selection import compare, select_decision_forecasts
from forecasting.domain.horizon import bucket_for
from forecasting.domain.metrics import percentile, summarise

from .fakes import utc

POLICY = DecisionPolicy(cutoff=time(9, 0))
JAN_15 = DeliveryPeriod(date(2026, 1, 15), date(2026, 1, 15))


class DecisionPolicyTests(TestCase):
    def test_deadline_is_cutoff_on_the_previous_day(self):
        self.assertEqual(POLICY.deadline_for(date(2026, 1, 15)), utc(2026, 1, 14, 9))

    def test_deadline_follows_uk_summer_time(self):
        self.assertEqual(POLICY.deadline_for(date(2026, 7, 15)), utc(2026, 7, 14, 8))


class DeliveryPeriodTests(TestCase):
    def test_rejects_reversed_range(self):
        with self.assertRaises(InvalidPeriodError):
            DeliveryPeriod(date(2026, 1, 10), date(2026, 1, 9))

    def test_contains_uses_uk_delivery_day(self):
        self.assertTrue(JAN_15.contains(utc(2026, 1, 15, 23, 30)))
        self.assertFalse(JAN_15.contains(utc(2026, 1, 16, 0)))


class ForecastSelectionTests(TestCase):
    def test_picks_latest_forecast_published_before_deadline(self):
        target = utc(2026, 1, 15, 12)
        forecasts = [
            GenerationForecast(target, utc(2026, 1, 14, 4, 30), 1000),
            GenerationForecast(target, utc(2026, 1, 14, 7, 30), 1100),  # latest usable
            GenerationForecast(target, utc(2026, 1, 14, 9, 30), 1200),  # after the 09:00 deadline
        ]
        chosen = select_decision_forecasts(forecasts, JAN_15, POLICY)
        self.assertEqual(chosen[target].generation_mw, 1100)

    def test_ignores_targets_outside_period(self):
        forecasts = [GenerationForecast(utc(2026, 1, 16, 12), utc(2026, 1, 14, 7, 30), 900)]
        self.assertEqual(select_decision_forecasts(forecasts, JAN_15, POLICY), {})

    def test_compare_drops_hours_without_actuals(self):
        forecasts = [
            GenerationForecast(utc(2026, 1, 15, 1), utc(2026, 1, 14, 7, 30), 500),
            GenerationForecast(utc(2026, 1, 15, 2), utc(2026, 1, 14, 7, 30), 600),
        ]
        actuals = [ActualGeneration(utc(2026, 1, 15, 1), 450)]
        result = compare(forecasts, actuals)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].error_mw, 50)


class MetricsTests(TestCase):
    def test_percentile_interpolates(self):
        self.assertEqual(percentile([0, 10, 20, 30, 40], 50), 20)
        self.assertEqual(percentile([0, 10], 90), 9)

    def test_summary_values(self):
        t = utc(2026, 1, 15)
        points = [
            ForecastComparison(t, t, forecast_mw=110, actual_mw=100),  # +10
            ForecastComparison(t, t, forecast_mw=80, actual_mw=100),   # -20
        ]
        summary = summarise(points)
        self.assertEqual(summary.mae_mw, 15)
        self.assertEqual(summary.bias_mw, -5)
        self.assertEqual(summary.rmse_mw, 15.8)
        self.assertEqual(summary.nmae_pct, 15)

    def test_summary_of_nothing_is_none(self):
        self.assertIsNone(summarise([]))


class HorizonTests(TestCase):
    def test_bucket_boundaries(self):
        self.assertEqual(bucket_for(6).label, "0-6h")
        self.assertEqual(bucket_for(6.5).label, "6-12h")
        self.assertIsNone(bucket_for(0))
        self.assertIsNone(bucket_for(80))
