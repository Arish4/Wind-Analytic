"""Turn use-case results into JSON-friendly dicts."""
from dataclasses import asdict

from forecasting.application.use_cases import DayAheadReport, HorizonReport
from forecasting.domain.delivery import DeliveryPeriod
from forecasting.domain.metrics import ErrorSummary


def summary_json(summary: ErrorSummary | None) -> dict | None:
    return asdict(summary) if summary else None


def period_json(period: DeliveryPeriod) -> dict:
    return {"start": period.first_day.isoformat(), "end": period.last_day.isoformat()}


def day_ahead_json(report: DayAheadReport) -> dict:
    return {
        "period": period_json(report.period),
        "cutoff": report.policy.cutoff.strftime("%H:%M"),
        "summary": summary_json(report.overall),
        "points": [
            {
                "start_time": p.start_time.isoformat(),
                "publish_time": p.publish_time.isoformat(),
                "forecast_mw": p.forecast_mw,
                "actual_mw": p.actual_mw,
                "error_mw": p.error_mw,
                "horizon_hours": p.horizon_hours,
            }
            for p in report.points
        ],
        "by_hour_of_day": [
            {"hour": hour, **summary_json(summary)} for hour, summary in report.by_hour_of_day.items()
        ],
        "by_delivery_day": [
            {"day": day.isoformat(), **summary_json(summary)} for day, summary in report.by_delivery_day.items()
        ],
    }


def horizon_json(report: HorizonReport) -> dict:
    return {
        "period": period_json(report.period),
        "buckets": [
            {
                "label": item.bucket.label,
                "min_hours": item.bucket.min_hours,
                "max_hours": item.bucket.max_hours,
                "summary": summary_json(item.summary),
            }
            for item in report.buckets
        ],
    }
