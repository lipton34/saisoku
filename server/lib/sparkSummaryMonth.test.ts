import assert from "node:assert/strict";
import test from "node:test";
import { isSparkSummaryMonthInRange, parseSparkSummaryMonth, sparkSummaryMonthStartJst, sparkHistorySummaryLowerBound } from "./sparkSummaryMonth.js";

test("rejects invalid, non-existent, or malformed months", () => {
  for (const month of ["2026-00", "2026-13", "2026-99", "2026-1", "2026-001", "2026-02-01", "0000-01", "", null, 202601, undefined]) {
    assert.equal(parseSparkSummaryMonth(month), null, String(month));
  }
});

test("parses valid January and December months without rollover", () => {
  assert.equal(parseSparkSummaryMonth("2026-01")?.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(parseSparkSummaryMonth("2026-12")?.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(parseSparkSummaryMonth("2024-02")?.toISOString(), "2024-02-01T00:00:00.000Z");
});

test("accepts history-start and current-month boundaries but rejects past/future", () => {
  const start = parseSparkSummaryMonth("2026-03")!;
  const current = parseSparkSummaryMonth("2026-10")!;
  assert.equal(isSparkSummaryMonthInRange(parseSparkSummaryMonth("2026-03")!, start, current), true);
  assert.equal(isSparkSummaryMonthInRange(parseSparkSummaryMonth("2026-10")!, start, current), true);
  assert.equal(isSparkSummaryMonthInRange(parseSparkSummaryMonth("2026-02")!, start, current), false);
  assert.equal(isSparkSummaryMonthInRange(parseSparkSummaryMonth("2026-11")!, start, current), false);
});

test("selected month starts at JST midnight, including year rollover", () => {
  assert.equal(sparkSummaryMonthStartJst(parseSparkSummaryMonth("2026-10")!).toISOString(), "2026-09-30T15:00:00.000Z");
  assert.equal(sparkSummaryMonthStartJst(parseSparkSummaryMonth("2026-01")!).toISOString(), "2025-12-31T15:00:00.000Z");
});

test("JST first day 00:00 through 08:59 is included, prior month excluded", () => {
  const lower = sparkHistorySummaryLowerBound(new Date("2026-09-05T02:00:00.000Z"), parseSparkSummaryMonth("2026-10"));
  assert.equal(lower.toISOString(), "2026-09-30T15:00:00.000Z");
  assert.equal(new Date("2026-09-30T14:59:59.999Z") >= lower, false);
  assert.equal(new Date("2026-09-30T15:00:00.000Z") >= lower, true);
  assert.equal(new Date("2026-09-30T23:59:59.999Z") >= lower, true);
});

test("changing selected month moves lower bound but never predates history start", () => {
  const started = new Date("2026-09-30T17:00:00.000Z");
  assert.equal(sparkHistorySummaryLowerBound(started, parseSparkSummaryMonth("2026-10")).toISOString(), started.toISOString());
  assert.equal(sparkHistorySummaryLowerBound(started, parseSparkSummaryMonth("2026-11")).toISOString(), "2026-10-31T15:00:00.000Z");
  assert.equal(sparkHistorySummaryLowerBound(started, null).toISOString(), started.toISOString());
});
