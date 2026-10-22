import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteRoundGoalOrder } from "./roundGoalOrder.js";

test("accepts complete permutations and empty list when no goals exist", () => {
  assert.equal(isCompleteRoundGoalOrder(["c", "a", "b"], ["a", "b", "c"]), true);
  assert.equal(isCompleteRoundGoalOrder([], []), true);
});

test("rejects partial, extra, duplicate, foreign and wrong-type IDs", () => {
  const existing = ["a", "b", "c"];
  for (const candidate of [[], ["a"], ["a", "b"], ["a", "b", "x"], ["a", "a", "b"], ["a", "b", "c", "x"], ["a", 2, "c"], null, {}, "a,b,c"]) {
    assert.equal(isCompleteRoundGoalOrder(candidate, existing), false, String(candidate));
  }
});

test("detects changed goal set at request time", () => {
  assert.equal(isCompleteRoundGoalOrder(["a", "b"], ["a", "b", "new"]), false);
  assert.equal(isCompleteRoundGoalOrder(["a", "b"], ["a"]), false);
});
