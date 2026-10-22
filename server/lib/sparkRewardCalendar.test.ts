import assert from "node:assert/strict";
import test from "node:test";
import { jstForecastMonths, jstMonthsInterval, belongsToJstMonth, formatJstCalendarDate } from "./sparkRewardCalendar.js";

test("JST month rolls over at 15:00Z and advances across calendar years", () => {
  assert.deepEqual(jstForecastMonths(new Date("2026-12-31T14:59:59.999Z")), [
    { year: 2026, month: 12 }, { year: 2027, month: 1 }, { year: 2027, month: 2 }
  ]);
  assert.deepEqual(jstForecastMonths(new Date("2026-12-31T15:00:00.000Z")), [
    { year: 2027, month: 1 }, { year: 2027, month: 2 }, { year: 2027, month: 3 }
  ]);
});

test("monthly schedule window includes first JST instant and excludes next period", () => {
  const months = jstForecastMonths(new Date("2026-10-22T00:00:00Z"));
  const range = jstMonthsInterval(months);
  assert.equal(range.gte.toISOString(), "2026-09-30T15:00:00.000Z");
  assert.equal(range.lt.toISOString(), "2026-12-31T15:00:00.000Z");
  assert.equal(belongsToJstMonth(new Date("2026-09-30T14:59:59.999Z"), months[0]), false);
  assert.equal(belongsToJstMonth(range.gte, months[0]), true);
  assert.equal(belongsToJstMonth(new Date("2026-10-31T14:59:59.999Z"), months[0]), true);
  assert.equal(belongsToJstMonth(new Date("2026-10-31T15:00:00.000Z"), months[0]), false);
});

test("JST display date does not depend on local Date string parsing", () => {
  assert.equal(formatJstCalendarDate(new Date("2026-10-31T15:00:00Z")), "2026-11-01");
  assert.equal(formatJstCalendarDate(new Date("2026-12-31T15:00:00Z")), "2027-01-01");
  assert.equal(formatJstCalendarDate(new Date("2026-02-28T14:59:59Z")), "2026-02-28");
});
