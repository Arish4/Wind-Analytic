const UK = "Europe/London";

export const formatGw = (mw: number, digits = 1) => `${(mw / 1000).toFixed(digits)} GW`;

export const formatSignedGw = (mw: number) => `${mw > 0 ? "+" : ""}${(mw / 1000).toFixed(1)} GW`;

export const formatMw = (mw: number) => `${Math.round(mw).toLocaleString("en-GB")} MW`;

export const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: UK });

export const formatDateTime = (date: Date) =>
  date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: UK });

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: UK });

/** A YYYY-MM-DD delivery day, e.g. "Thu 15 Jan". */
export const formatDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
