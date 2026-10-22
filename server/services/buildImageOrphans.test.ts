import assert from "node:assert/strict";
import test from "node:test";
import { buildImageReferenceKey, isRecoverableBuildImage } from "./buildImageOrphans.js";

const now = new Date("2026-10-22T00:00:00Z");
const file = { storageBucket: "drafts-private", storagePath: "drafts/draft123/old.png", createdAt: "2026-10-19T00:00:00Z" };

test("old unreferenced app image is eligible for recovery", () => {
  assert.equal(isRecoverableBuildImage(file, new Set(), now), true);
  assert.equal(isRecoverableBuildImage({ ...file, storagePath: "posts/post123/old.webp" }, new Set(), now), true);
});
test("referenced image remains protected", () => {
  const ref = new Set([buildImageReferenceKey(file.storageBucket, file.storagePath)]);
  assert.equal(isRecoverableBuildImage(file, ref, now), false);
  assert.equal(isRecoverableBuildImage(file, new Set([buildImageReferenceKey("other-bucket", file.storagePath)]), now), true);
});
test("recent, future-dated, or unknown-age images are never deleted", () => {
  for (const createdAt of ["2026-10-21T23:59:59Z", "2026-10-23T00:00:00Z", "", null, "not a date"]) {
    assert.equal(isRecoverableBuildImage({ ...file, createdAt }, new Set(), now), false, String(createdAt));
  }
});
test("files outside exact managed app image path are never selected", () => {
  for (const storagePath of ["public/foo.png", "posts/old.png", "posts/id/subdir/foo.png", "posts/id/private.txt", "drafts/id/foo.svg", "../drafts/id/foo.png", "drafts/id/foo.png/extra"]) {
    assert.equal(isRecoverableBuildImage({ ...file, storagePath }, new Set(), now), false, storagePath);
  }
});
