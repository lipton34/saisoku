import assert from "node:assert/strict";
import test from "node:test";
import { loadProgressOwnerValues, mergeGoalInventory } from "./progressOwnerValues.js";

test("many goals reuse exactly two owner-wide reads", async () => {
  let inventoryReads = 0;
  let sharedReads = 0;
  const values = await loadProgressOwnerValues("owner-a", {
    inventory: async (ownerId) => {
      assert.equal(ownerId, "owner-a");
      inventoryReads++;
      return [{ itemKey: "item-a", ownedCount: 12 }];
    },
    shared: async (ownerId) => {
      assert.equal(ownerId, "owner-a");
      sharedReads++;
      return [{ valueKey: "value-a", value: 3 }];
    }
  });
  for (let index = 0; index < 25; index++) {
    const inventory = mergeGoalInventory(values.inventory);
    assert.equal(inventory.get("item-a"), 12);
    assert.equal(values.shared.get("value-a"), 3);
  }
  assert.equal(inventoryReads, 1);
  assert.equal(sharedReads, 1);
});

test("goal overrides remain isolated from other goals", async () => {
  const values = await loadProgressOwnerValues("owner", {
    inventory: async () => [{ itemKey: "item-a", ownedCount: 5 }],
    shared: async () => []
  });
  const first = mergeGoalInventory(values.inventory, new Map([["item-a", 99]]));
  const second = mergeGoalInventory(values.inventory);
  assert.equal(first.get("item-a"), 99);
  assert.equal(second.get("item-a"), 5);
  assert.equal(values.inventory.get("item-a"), 5);
});

test("query failure propagates and does not return partial snapshot", async () => {
  await assert.rejects(loadProgressOwnerValues("owner", {
    inventory: async () => [],
    shared: async () => { throw new Error("database unavailable"); }
  }), /database unavailable/);
});
