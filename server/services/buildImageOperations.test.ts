import assert from "node:assert/strict";
import test from "node:test";
import { cleanupDeletedBuildImages, saveBuildImage } from "./buildImageOperations.js";

for (const kind of ["post", "draft"]) {
  const path = kind + "s/owner/img.png";
  test(`${kind}: upload and persist preserve metadata`, async () => {
    let removed = false;
    const result = await saveBuildImage({
      storagePath: path,
      buffer: Buffer.from("image"),
      mimeType: "image/png",
      upload: async () => ({ bucket: "bucket", publicUrl: "https://example.invalid/image" }),
      persist: async (stored) => stored,
      remove: async () => { removed = true; },
      logCleanupFailure: () => { throw new Error("unexpected cleanup"); }
    });
    assert.equal(result.storagePath, path);
    assert.equal(result.storageBucket, "bucket");
    assert.equal(removed, false);
  });

  test(`${kind}: DB error triggers compensating deletion`, async () => {
    const removed: string[] = [];
    await assert.rejects(saveBuildImage({
      storagePath: path,
      buffer: Buffer.from("image"),
      mimeType: "image/png",
      upload: async () => ({ bucket: "bucket", publicUrl: "url" }),
      persist: async () => { throw new Error("database failed"); },
      remove: async (images) => { removed.push(...images.map((image) => image.storagePath)); },
      logCleanupFailure: () => { throw new Error("unexpected cleanup"); }
    }), /database failed/);
    assert.deepEqual(removed, [path]);
  });

  test(`${kind}: cleanup retries and reports persistent failure`, async () => {
    let attempts = 0;
    let logged = false;
    await cleanupDeletedBuildImages([{ storageBucket: "bucket", storagePath: path }], async () => {
      attempts += 1;
      throw new Error("storage unavailable");
    }, () => { logged = true; });
    assert.equal(attempts, 3);
    assert.equal(logged, true);
  });
}
