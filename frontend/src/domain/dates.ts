// Calendar helpers on plain YYYY-MM-DD strings, plus UK delivery-day conversion.

export function daysInPeriod(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** The UK delivery day (YYYY-MM-DD) a moment falls in. */
export function ukDay(moment: Date): string {
  return moment.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}
