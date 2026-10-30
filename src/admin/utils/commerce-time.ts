/** Format a booking slot in its recorded timezone, never the staff browser's. */
export function commerceSlotRange(
  start: string,
  end: string,
  timezone: string,
): string {
  const startsAt = new Date(start);
  const endsAt = new Date(end);
  if (
    !start ||
    !end ||
    !timezone ||
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime())
  ) {
    return "Schedule unavailable";
  }
  try {
    const format = new Intl.DateTimeFormat("en-JM", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${format.format(startsAt)} – ${format.format(endsAt)} (${timezone})`;
  } catch {
    return "Schedule unavailable";
  }
}
