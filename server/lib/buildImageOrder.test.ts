import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteImageOrder } from "./buildImageOrder.js";

const saved = ["a", "b", "c"];
test("accepts exact complete permutation for post and draft images", () => {
  assert.equal(isCompleteImageOrder(["c", "a", "b"], saved), true);
  assert.equal(isCompleteImageOrder(["b", "c", "a"], saved), true);
});
test("rejects missing, extra, and duplicate IDs", () => {
  for (const ids of [[], ["a"], ["a", "b"], ["a", "b", "z"], ["a", "a", "b"], ["a", "b", "c", "z"]]) {
    assert.equal(isCompleteImageOrder(ids, saved), false);
  }
});
test("rejects malformed input instead of silently filtering", () => {
  for (const ids of [undefined, null, "a,b,c", ["a", "b", 3], ["a", null, "c"]]) {
    assert.equal(isCompleteImageOrder(ids, saved), false);
  }
});
test("supports zero images and rejects six images", () => {
  assert.equal(isCompleteImageOrder([], []), true);
  assert.equal(isCompleteImageOrder(["1", "2", "3", "4", "5", "6"], ["1", "2", "3", "4", "5", "6"]), false);
});
