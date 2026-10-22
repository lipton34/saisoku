import assert from "node:assert/strict";
import test from "node:test";
import { buildDraftScreenshotBucket, buildScreenshotBucket } from "./buildImageStorage.js";

test("draft bucket defaults to a separate bucket from public screenshots", () => {
  const beforePublic = process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET;
  const beforePrivate = process.env.SUPABASE_BUILD_DRAFT_BUCKET;
  try {
    delete process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET;
    delete process.env.SUPABASE_BUILD_DRAFT_BUCKET;
    assert.equal(buildScreenshotBucket(), "gbf-build-screenshots");
    assert.equal(buildDraftScreenshotBucket(), "gbf-build-screenshots-drafts");
    assert.notEqual(buildDraftScreenshotBucket(), buildScreenshotBucket());
    process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET = "custom-post-images";
    assert.equal(buildDraftScreenshotBucket(), "custom-post-images-drafts");
    process.env.SUPABASE_BUILD_DRAFT_BUCKET = "private-drafts";
    assert.equal(buildDraftScreenshotBucket(), "private-drafts");
  } finally {
    if (beforePublic === undefined) delete process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET;
    else process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET = beforePublic;
    if (beforePrivate === undefined) delete process.env.SUPABASE_BUILD_DRAFT_BUCKET;
    else process.env.SUPABASE_BUILD_DRAFT_BUCKET = beforePrivate;
  }
});
