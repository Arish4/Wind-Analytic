"""What the pilot covers: purchase decisions made during January 2026."""
from datetime import date, time

from forecasting.domain.delivery import DecisionPolicy, DeliveryPeriod

# A decision on 1-31 Jan buys power for the following day: 2 Jan to 1 Feb.
PILOT_PERIOD = DeliveryPeriod(first_day=date(2026, 1, 2), last_day=date(2026, 2, 1))

# Conservative default: before the morning GB day-ahead auctions close.
DEFAULT_POLICY = DecisionPolicy(cutoff=time(9, 0))
