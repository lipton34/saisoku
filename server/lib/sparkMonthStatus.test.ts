import assert from "node:assert/strict";
import test from "node:test";
import { parseSparkMonthComplete } from "./sparkMonthStatus.js";

test("accepts only true and false booleans", () => {
  assert.equal(parseSparkMonthComplete(true), true);
  assert.equal(parseSparkMonthComplete(false), false);
});
test("rejects string false, missing, null and other coercible values", () => {
  for (const input of ["false", "true", undefined, null, 0, 1, "", {}, []]) {
    assert.throws(() => parseSparkMonthComplete(input), /集計完了フラグ/);
  }
});
