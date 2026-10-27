"""Error statistics for a set of forecast-vs-actual comparisons."""
import math
from collections import defaultdict
from collections.abc import Callable, Hashable, Sequence
from dataclasses import dataclass
from typing import TypeVar

from .entities import ForecastComparison

Key = TypeVar("Key", bound=Hashable)


@dataclass(frozen=True)
class ErrorSummary:
    sample_count: int
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    p10_error_mw: float
    p50_error_mw: float
    p90_error_mw: float
    max_abs_error_mw: float
    mean_actual_mw: float
    nmae_pct: float


def percentile(values: Sequence[float], pct: float) -> float:
    """Linear-interpolated percentile, pct in [0, 100]."""
    ordered = sorted(values)
    position = (len(ordered) - 1) * pct / 100
    lower = math.floor(position)
    upper = math.ceil(position)
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def summarise(comparisons: Sequence[ForecastComparison]) -> ErrorSummary | None:
    if not comparisons:
        return None

    errors = [c.error_mw for c in comparisons]
    count = len(errors)
    mae = sum(abs(e) for e in errors) / count
    mean_actual = sum(c.actual_mw for c in comparisons) / count

    return ErrorSummary(
        sample_count=count,
        mae_mw=round(mae, 1),
        rmse_mw=round(math.sqrt(sum(e * e for e in errors) / count), 1),
        bias_mw=round(sum(errors) / count, 1),
        p10_error_mw=round(percentile(errors, 10), 1),
        p50_error_mw=round(percentile(errors, 50), 1),
        p90_error_mw=round(percentile(errors, 90), 1),
        max_abs_error_mw=round(max(abs(e) for e in errors), 1),
        mean_actual_mw=round(mean_actual, 1),
        nmae_pct=round(100 * mae / mean_actual, 2) if mean_actual else 0.0,
    )


def summarise_by(
    comparisons: Sequence[ForecastComparison],
    key: Callable[[ForecastComparison], Key],
) -> dict[Key, ErrorSummary]:
    groups: dict[Key, list[ForecastComparison]] = defaultdict(list)
    for comparison in comparisons:
        groups[key(comparison)].append(comparison)
    return {group_key: summarise(items) for group_key, items in sorted(groups.items())}
