"""Lead-time buckets: how far ahead a forecast was made."""
from dataclasses import dataclass


@dataclass(frozen=True)
class HorizonBucket:
    min_hours: int
    max_hours: int

    @property
    def label(self) -> str:
        return f"{self.min_hours}-{self.max_hours}h"

    def contains(self, hours: float) -> bool:
        return self.min_hours < hours <= self.max_hours


HORIZON_BUCKETS = (
    HorizonBucket(0, 6),
    HorizonBucket(6, 12),
    HorizonBucket(12, 24),
    HorizonBucket(24, 36),
    HorizonBucket(36, 48),
    HorizonBucket(48, 72),
)

MAX_HORIZON_HOURS = HORIZON_BUCKETS[-1].max_hours


def bucket_for(hours: float) -> HorizonBucket | None:
    return next((bucket for bucket in HORIZON_BUCKETS if bucket.contains(hours)), None)
