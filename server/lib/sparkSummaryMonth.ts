/** Parse a real YYYY-MM calendar month as a UTC date for month-only comparisons. */
export function parseSparkSummaryMonth(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const requested = new Date(`${value}-01T00:00:00.000Z`);
  return Number.isNaN(requested.getTime()) || requested.toISOString().slice(0, 7) !== value ? null : requested;
}

/** The history start month is included, as is the current calendar month. */
export function isSparkSummaryMonthInRange(month: Date, historyStartMonth: Date, currentMonth: Date): boolean {
  return month >= historyStartMonth && month <= currentMonth;
}
