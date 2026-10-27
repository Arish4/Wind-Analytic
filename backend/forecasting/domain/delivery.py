"""Delivery days and the day-ahead decision deadline, in UK local time."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

UK_TZ = ZoneInfo("Europe/London")


class InvalidPeriodError(ValueError):
    pass


def delivery_day_of(moment: datetime) -> date:
    return moment.astimezone(UK_TZ).date()


@dataclass(frozen=True)
class DeliveryPeriod:
    """An inclusive range of UK delivery days."""

    first_day: date
    last_day: date

    def __post_init__(self) -> None:
        if self.first_day > self.last_day:
            raise InvalidPeriodError("first_day must be on or before last_day")

    @property
    def starts_at(self) -> datetime:
        return datetime.combine(self.first_day, time.min, tzinfo=UK_TZ)

    @property
    def ends_at(self) -> datetime:
        """Exclusive end: midnight after the last delivery day."""
        return datetime.combine(self.last_day + timedelta(days=1), time.min, tzinfo=UK_TZ)

    def contains(self, moment: datetime) -> bool:
        return self.first_day <= delivery_day_of(moment) <= self.last_day

    def includes_period(self, other: "DeliveryPeriod") -> bool:
        return self.first_day <= other.first_day and other.last_day <= self.last_day


@dataclass(frozen=True)
class DecisionPolicy:
    """When the trading team commits its day-ahead purchase."""

    cutoff: time
    days_ahead: int = 1

    def deadline_for(self, delivery_day: date) -> datetime:
        decision_day = delivery_day - timedelta(days=self.days_ahead)
        return datetime.combine(decision_day, self.cutoff, tzinfo=UK_TZ)
