import assert from "node:assert/strict";
import test from "node:test";
import { persistWithStorageCompensation, removeWithRetry } from "./buildImageConsistency.js";

const ref = { storageBucket: "test", storagePath: "posts/1/pic.png", publicUrl: "https://example.invalid/pic.png" };

test("successful image persistence does not remove Storage image", async () => {
  let removes = 0;
  const result = await persistWithStorageCompensation(
    async () => ref,
    async (stored) => stored.publicUrl,
    async () => { removes += 1; },
    () => { throw new Error("unexpected cleanup failure"); }
  );
  assert.equal(result, ref.publicUrl);
  assert.equal(removes, 0);
});

test("DB failure triggers compensation, then preserves original error", async () => {
  const dbError = new Error("database write failed");
  const removed: string[] = [];
  await assert.rejects(persistWithStorageCompensation(
    async () => ref,
    async () => { throw dbError; },
    async (images) => { removed.push(...images.map((x) => x.storagePath)); },
    () => { throw new Error("unexpected cleanup failure"); }
  ), (error: unknown) => error === dbError);
  assert.deepEqual(removed, [ref.storagePath]);
});

test("upload failure never attempts DB insert or cleanup", async () => {
  let persisted = false;
  let removed = false;
  await assert.rejects(persistWithStorageCompensation(
    async () => { throw new Error("upload failure"); },
    async () => { persisted = true; },
    async () => { removed = true; },
    () => {}
  ), /upload failure/);
  assert.equal(persisted, false);
  assert.equal(removed, false);
});

test("transient Storage delete failure is retried", async () => {
  let n = 0;
  await removeWithRetry([ref], async () => {
    if (++n < 3) throw new Error("temporary");
  }, 3, async () => {});
  assert.equal(n, 3);
});

test("persistent cleanup failure is reported without masking DB failure", async () => {
  const dbError = new Error("db failed");
  let logged: unknown;
  await assert.rejects(persistWithStorageCompensation(
    async () => ref,
    async () => { throw dbError; },
    async () => { throw new Error("storage failed"); },
    (error) => { logged = error; }
  ), (error: unknown) => error === dbError);
  assert.match(String(logged), /storage failed/);
});

test("persistent Storage delete failure remains visible", async () => {
  let n = 0;
  await assert.rejects(removeWithRetry([ref], async () => {
    n += 1;
    throw new Error("storage down");
  }, 3, async () => {}), /storage down/);
  assert.equal(n, 3);
});
