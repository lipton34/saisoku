import assert from "node:assert/strict";
import test from "node:test";
import { BuildImageLimitError, createBuildImageWithinLimit } from "./buildImageLimit.js";

for (const kind of ["post", "draft"]) {
  test(`${kind}: concurrent uploads never exceed five images`, async () => {
    let images = 4;
    let nextLock = Promise.resolve();
    const lock = async () => {
      // Simulates a per-parent transaction lock held through count and insert.
      const previous = nextLock;
      let release!: () => void;
      nextLock = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      return release;
    };
    const results = await Promise.allSettled(Array.from({ length: 4 }, async () => {
      const release = await lock();
      try {
        return await createBuildImageWithinLimit(
          async () => undefined,
          async () => images,
          async (order) => { images++; return order; }
        );
      } finally {
        release();
      }
    }));
    assert.equal(images, 5);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected" && result.reason instanceof BuildImageLimitError).length, 3);
  });

  test(`${kind}: lock acquired before count and insert`, async () => {
    const steps: string[] = [];
    const value = await createBuildImageWithinLimit(
      async () => { steps.push("lock"); },
      async () => { steps.push("count"); return 2; },
      async (order) => { steps.push("insert"); return order; }
    );
    assert.equal(value, 2);
    assert.deepEqual(steps, ["lock", "count", "insert"]);
  });
}
