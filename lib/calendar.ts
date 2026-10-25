import { DeadlineSchema, type Deadline } from "./schema";
import { localDate } from "./dates";

export function deadlineLabel(deadline: Deadline) {
  return deadline.kind === "unknown"
    ? `Unresolved: ${deadline.raw || "no date supplied"}`
    : deadline.kind === "date"
      ? `${deadline.date} · cutoff time unknown`
      : `${deadline.at} · confirmed source offset ${deadline.zone}`;
}
export function agendaStatus(
  deadline: Deadline,
  now = new Date(),
): "Upcoming" | "Overdue" | "Unresolved date" {
  if (deadline.kind === "unknown") return "Unresolved date";
  return (
    deadline.kind === "date"
      ? deadline.date < localDate(now)
      : Date.parse(deadline.at) < now.getTime()
  )
    ? "Overdue"
    : "Upcoming";
}
const escape = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n?|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const compact = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function fold(line: string) {
  const encoder = new TextEncoder();
  let output = "",
    current = "";
  for (const char of line) {
    if (encoder.encode(current + char).length > 75) {
      output += current + "\r\n";
      current = " ";
    }
    current += char;
  }
  return output + current;
}
export function calendarEvent(input: {
  id: string;
  title: string;
  description: string;
  deadline: Deadline;
  updatedAt: string;
}) {
  const deadline = DeadlineSchema.parse(input.deadline);
  if (deadline.kind === "unknown")
    throw new Error(
      "Confirm the date and timezone before exporting a calendar event.",
    );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GrantPath//Local application agenda//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.id}@grantpath.local`,
    `DTSTAMP:${compact(new Date(input.updatedAt))}`,
    `SUMMARY:${escape(input.title)}`,
  ];
  let description =
    input.description +
    "\nFile import is a snapshot, not continuous calendar synchronization.";
  if (deadline.kind === "date") {
    const next = new Date(deadline.date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      `DTSTART;VALUE=DATE:${deadline.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
    );
    description +=
      "\nCutoff time is unknown. This all-day event does not establish a submission time.";
  } else lines.push(`DTSTART:${compact(new Date(deadline.at))}`);
  lines.push(
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(fold).join("\r\n") + "\r\n";
}
