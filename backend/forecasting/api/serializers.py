"""Validation of incoming query parameters."""
from rest_framework import serializers

from forecasting.application.scope import DEFAULT_POLICY, PILOT_PERIOD
from forecasting.domain.delivery import DecisionPolicy, DeliveryPeriod


class PeriodQuerySerializer(serializers.Serializer):
    start = serializers.DateField(default=PILOT_PERIOD.first_day)
    end = serializers.DateField(default=PILOT_PERIOD.last_day)

    def validate(self, attrs: dict) -> dict:
        if attrs["start"] > attrs["end"]:
            raise serializers.ValidationError("start must be on or before end.")
        if not PILOT_PERIOD.includes_period(DeliveryPeriod(attrs["start"], attrs["end"])):
            raise serializers.ValidationError(
                f"Dates must be between {PILOT_PERIOD.first_day} and {PILOT_PERIOD.last_day}."
            )
        return attrs

    def to_period(self) -> DeliveryPeriod:
        return DeliveryPeriod(self.validated_data["start"], self.validated_data["end"])


class DayAheadQuerySerializer(PeriodQuerySerializer):
    cutoff = serializers.TimeField(default=DEFAULT_POLICY.cutoff, input_formats=["%H:%M"])

    def to_policy(self) -> DecisionPolicy:
        return DecisionPolicy(cutoff=self.validated_data["cutoff"])
