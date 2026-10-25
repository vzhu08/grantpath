// Explicit workspace display-date basis; never use the execution host's timezone.
export const WORKSPACE_TIMEZONE = "America/New_York";
export function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WORKSPACE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
