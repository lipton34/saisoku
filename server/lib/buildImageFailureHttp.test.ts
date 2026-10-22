import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import type { Server } from "node:http";
import { saveBuildImage, cleanupDeletedBuildImages } from "../services/buildImageOperations.js";
import type { StorageImageRef } from "../services/buildImageConsistency.js";

/**
 * Isolated HTTP adapter exercising the same injected service functions as the
 * production image handlers. Does not access live Prisma or Supabase.
 * Full production-router failure injection remains tracked by Issue #35.
 */
async function startTestApp(params: {
  upload: () => Promise<{ bucket: string; publicUrl: string }>;
  persist: () => Promise<unknown>;
  remove: (images: StorageImageRef[]) => Promise<void>;
  log: (error: unknown) => void;
}) {
  const app = express();
  app.post("/images", async (_req, res) => {
    try {
      const image = await saveBuildImage({
        storagePath: "posts/post-id/test.png",
        buffer: Buffer.from("image"),
        mimeType: "image/png",
        upload: params.upload,
        persist: params.persist,
        remove: params.remove,
        logCleanupFailure: params.log
      });
      res.status(201).json({ image });
    } catch {
      res.status(500).json({ message: "画像を保存できませんでした" });
    }
  });
  app.delete("/images/:id", async (_req, res) => {
    try {
      // The DB record is already removed; best-effort Storage cleanup follows.
      await cleanupDeletedBuildImages(
        [{ storageBucket: "public", storagePath: "posts/post-id/test.png" }],
        params.remove,
        params.log
      );
      res.status(204).end();
    } catch {
      res.status(500).end();
    }
  });
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

test("HTTP adapter: upload failure produces 500 without DB write or cleanup", async () => {
  let dbWrites = 0;
  let removals = 0;
  const app = await startTestApp({
    upload: async () => { throw new Error("Storage upload unavailable"); },
    persist: async () => { dbWrites++; return {}; },
    remove: async () => { removals++; },
    log: () => {}
  });
  try {
    assert.equal((await fetch(app.url + "/images", { method: "POST" })).status, 500);
    assert.equal(dbWrites, 0);
    assert.equal(removals, 0);
  } finally { await app.close(); }
});

test("HTTP adapter: DB failure after Storage upload compensates before responding 500", async () => {
  const removed: StorageImageRef[] = [];
  let uploads = 0;
  const app = await startTestApp({
    upload: async () => { uploads++; return { bucket: "public", publicUrl: "https://example.test/pic.png" }; },
    persist: async () => { throw new Error("DB create failed"); },
    remove: async (images) => { removed.push(...images); },
    log: () => assert.fail("cleanup should succeed")
  });
  try {
    assert.equal((await fetch(app.url + "/images", { method: "POST" })).status, 500);
    assert.equal(uploads, 1);
    assert.deepEqual(removed, [{ storageBucket: "public", storagePath: "posts/post-id/test.png" }]);
  } finally { await app.close(); }
});

test("HTTP adapter: persistent cleanup failure logs, retries and does not undo deleted DB row", async () => {
  let removeAttempts = 0;
  const logged: unknown[] = [];
  const app = await startTestApp({
    upload: async () => ({ bucket: "public", publicUrl: "" }),
    persist: async () => ({}),
    remove: async () => { removeAttempts++; throw new Error("Storage delete unavailable"); },
    log: (error) => { logged.push(error); }
  });
  try {
    assert.equal((await fetch(app.url + "/images/image-id", { method: "DELETE" })).status, 204);
    assert.equal(removeAttempts, 3);
    assert.equal(logged.length, 1);
    assert.match(String(logged[0]), /Storage delete unavailable/);
  } finally { await app.close(); }
});
