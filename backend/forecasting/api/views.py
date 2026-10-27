from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from forecasting.application.scope import DEFAULT_POLICY, PILOT_PERIOD
from forecasting.container import get_container
from forecasting.domain.horizon import HORIZON_BUCKETS

from .presenters import day_ahead_json, horizon_json, period_json
from .serializers import DayAheadQuerySerializer, PeriodQuerySerializer


class HealthView(APIView):
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class MetaView(APIView):
    """Defaults and limits the frontend needs to build its controls."""

    def get(self, request: Request) -> Response:
        return Response({
            "period": period_json(PILOT_PERIOD),
            "default_cutoff": DEFAULT_POLICY.cutoff.strftime("%H:%M"),
            "horizon_buckets": [bucket.label for bucket in HORIZON_BUCKETS],
            "timezone": "Europe/London",
        })


class DayAheadReportView(APIView):
    def get(self, request: Request) -> Response:
        query = DayAheadQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        report = get_container().day_ahead_report.execute(query.to_period(), query.to_policy())
        return Response(day_ahead_json(report))


class HorizonReportView(APIView):
    def get(self, request: Request) -> Response:
        query = PeriodQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        report = get_container().horizon_report.execute(query.to_period())
        return Response(horizon_json(report))
