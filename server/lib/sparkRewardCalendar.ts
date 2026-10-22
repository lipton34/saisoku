const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Derive the Japan calendar date without server-local parsing. */
export function jstCalendarParts(value: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(value);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: number("year"), month: number("month"), day: number("day") };
}

export function jstForecastMonths(value: Date, count = 3): { year: number; month: number }[] {
  const current = jstCalendarParts(value);
  return Array.from({ length: count }, (_, offset) => {
    const utc = new Date(Date.UTC(current.year, current.month - 1 + offset, 1));
    return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1 };
  });
}

/** End is exclusive; JST midnight is 15:00 UTC on the previous day. */
export function jstMonthsInterval(months: readonly { year: number; month: number }[]): { gte: Date; lt: Date } {
  if (!months.length) throw new Error("At least one calendar month is required");
  const first = months[0];
  const last = months[months.length - 1];
  return {
    gte: new Date(Date.UTC(first.year, first.month - 1, 1) - JST_OFFSET_MS),
    lt: new Date(Date.UTC(last.year, last.month, 1) - JST_OFFSET_MS)
  };
}

export function formatJstCalendarDate(value: Date): string {
  const { year, month, day } = jstCalendarParts(value);
  return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function belongsToJstMonth(value: Date, month: { year: number; month: number }): boolean {
  const calendar = jstCalendarParts(value);
  return calendar.year === month.year && calendar.month === month.month;
}
