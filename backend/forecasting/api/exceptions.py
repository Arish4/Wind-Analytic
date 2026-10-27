from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from forecasting.application.ports import DataSourceUnavailable


def api_exception_handler(exc: Exception, context: dict) -> Response | None:
    if isinstance(exc, DataSourceUnavailable):
        return Response(
            {"detail": "Elexon data is temporarily unavailable. Please try again shortly."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return exception_handler(exc, context)
