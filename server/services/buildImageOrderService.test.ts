import assert from "node:assert/strict";
import test from "node:test";
import { reorderOwnedBuildImages } from "./buildImageOrderService.js";

for (const label of ["post", "draft"]) {
  test(`${label}: valid reorder updates all images in the given order`, async () => {
    const updated: string[] = [];
    const result = await reorderOwnedBuildImages(
      ["c", "a", "b"],
      async () => ["a", "b", "c"],
      async (id, order) => { updated.push(`${order}:${id}`); return { count: 1 }; }
    );
    assert.equal(result, true);
    assert.deepEqual(updated, ["0:c", "1:a", "2:b"]);
  });

  test(`${label}: invalid order never issues database updates`, async () => {
    let called = false;
    for (const invalid of [["a"], ["a", "a"], ["a", "unknown"], null, ["a", 5]]) {
      const result = await reorderOwnedBuildImages(invalid, async () => ["a", "b"], async () => {
        called = true;
        return { count: 1 };
      });
      assert.equal(result, false);
    }
    assert.equal(called, false);
  });

  test(`${label}: unexpected update count marks the operation failed`, async () => {
    const result = await reorderOwnedBuildImages(["a"], async () => ["a"], async () => ({ count: 0 }));
    assert.equal(result, false);
  });
}
