import assert from "node:assert/strict";
import test from "node:test";
import { validateInventoryBatch } from "./progressInventoryBatch.js";

const requirements = [{ itemKey: "a", itemName: "素材A" }, { itemKey: "b", itemName: "素材B" }];

test("accepts valid inventory batch and an empty no-op", () => {
  assert.deepEqual(validateInventoryBatch([{ itemKey: "a", ownedCount: 5 }, { itemKey: "b", ownedCount: 0 }], requirements), [
    { itemKey: "a", itemName: "素材A", ownedCount: 5 },
    { itemKey: "b", itemName: "素材B", ownedCount: 0 }
  ]);
  assert.deepEqual(validateInventoryBatch([], requirements), []);
});

test("rejects entire batch on any invalid, unknown or duplicate item", () => {
  for (const input of [
    [{ itemKey: "a", ownedCount: 1 }, { itemKey: "b", ownedCount: -1 }],
    [{ itemKey: "a", ownedCount: 1 }, { itemKey: "a", ownedCount: 2 }],
    [{ itemKey: "x", ownedCount: 2 }],
    [{ itemKey: "a", ownedCount: 1.5 }],
    [{ itemKey: "a", ownedCount: 10_000_000 }],
    [{ itemKey: "a", ownedCount: "2" }],
    [{ itemKey: "a", ownedCount: 1 }, null],
    null, {}, "invalid"
  ]) assert.equal(validateInventoryBatch(input, requirements), null);
});
