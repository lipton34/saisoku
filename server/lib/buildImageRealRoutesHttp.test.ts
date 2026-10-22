import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import { createBuildRouters } from "../routes/builds.js";

type Fakes = Parameters<typeof createBuildRouters>[0];

async function start(deps: Fakes) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: "test-owner", username: "tester", displayName: null };
    next();
  });
  const { buildsRouter, buildDraftsRouter } = createBuildRouters(deps);
  app.use("/posts", buildsRouter);
  app.use("/drafts", buildDraftsRouter);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: error instanceof Error ? error.message : "error" });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve()))
  };
}

function image() {
  const data = new FormData();
  data.set("image", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "sample.png");
  return data;
}

for (const kind of ["posts", "drafts"] as const) {
  test(`actual ${kind} upload: Storage succeeds, DB insert fails, then compensates`, async () => {
    let uploads = 0;
    const removed: string[] = [];
    let inserts = 0;
    const table = {
      count: async () => 0,
      create: async () => { inserts++; throw new Error("DB create failed"); }
    };
    const fake = {
      buildPost: { findFirst: async () => ({ id: "owner-post" }) },
      buildDraft: { findFirst: async () => ({ id: "owner-draft" }) },
      buildPostImage: table,
      buildDraftImage: table,
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
        $queryRaw: async () => [],
        buildPostImage: table,
        buildDraftImage: table
      })
    };
    const app = await start({
      prisma: fake as never,
      uploadBuildImageToStorage: async () => { uploads++; return { bucket: kind, publicUrl: "" }; },
      removeBuildImagesFromStorage: async (images) => { removed.push(...images.map((entry) => entry.storagePath)); }
    });
    try {
      const response = await fetch(`${app.url}/${kind}/owner-id/images`, { method: "POST", body: image() });
      assert.equal(response.status, 500);
      assert.equal(uploads, 1);
      assert.equal(inserts, 1);
      assert.equal(removed.length, 1);
      assert.match(removed[0], new RegExp(`^${kind === "posts" ? "posts" : "drafts"}/`));
    } finally { await app.close(); }
  });
}

test("actual post delete: DB succeeds, Storage fails after retries, returns 204", async () => {
  let dbDeletes = 0;
  let storageDeletes = 0;
  const fake = {
    buildPostImage: {
      findFirst: async () => ({ id: "pic", storageBucket: "test-public", storagePath: "posts/post-id/pic.png" }),
      delete: async () => { dbDeletes++; }
    }
  };
  const app = await start({
    prisma: fake as never,
    removeBuildImagesFromStorage: async () => { storageDeletes++; throw new Error("Storage unavailable"); }
  });
  try {
    const response = await fetch(app.url + "/posts/post-id/images/pic", { method: "DELETE" });
    assert.equal(response.status, 204);
    assert.equal(dbDeletes, 1);
    assert.equal(storageDeletes, 3);
  } finally { await app.close(); }
});

test("actual draft delete: DB succeeds, Storage fails after retries, returns 204", async () => {
  let dbDeletes = 0;
  let storageDeletes = 0;
  const fake = {
    buildDraftImage: {
      findFirst: async () => ({ id: "pic", storageBucket: "test-private", storagePath: "drafts/draft-id/pic.png" }),
      delete: async () => { dbDeletes++; }
    }
  };
  const app = await start({
    prisma: fake as never,
    removeBuildImagesFromStorage: async () => { storageDeletes++; throw new Error("Storage unavailable"); }
  });
  try {
    const response = await fetch(app.url + "/drafts/draft-id/images/pic", { method: "DELETE" });
    assert.equal(response.status, 204);
    assert.equal(dbDeletes, 1);
    assert.equal(storageDeletes, 3);
  } finally { await app.close(); }
});

for (const kind of ["posts", "drafts"] as const) {
  test(`actual ${kind} order endpoint validates complete ID set and concurrent updates`, async () => {
    const updates: Array<{ id: string; displayOrder: number }> = [];
    let affected = 1;
    const table = {
      findMany: async () => [{ id: "a" }, { id: "b" }],
      updateMany: async ({ where, data }: { where: { id: string }; data: { displayOrder: number } }) => {
        updates.push({ id: where.id, displayOrder: data.displayOrder });
        return { count: affected };
      }
    };
    const fake = {
      buildPost: { findFirst: async () => ({ id: "record-id" }) },
      buildDraft: { findFirst: async () => ({ id: "record-id" }) },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
        buildPostImage: table,
        buildDraftImage: table
      })
    };
    const app = await start({ prisma: fake as never });
    try {
      const path = `${app.url}/${kind}/record-id/images/order`;
      const send = (imageIds: string[]) => fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds })
      });
      assert.equal((await send(["b", "a"])).status, 204);
      assert.deepEqual(updates, [{ id: "b", displayOrder: 0 }, { id: "a", displayOrder: 1 }]);
      updates.length = 0;
      assert.equal((await send(["a"])).status, 400);
      assert.equal(updates.length, 0);
      assert.equal((await send(["a", "a"])).status, 400);
      assert.equal(updates.length, 0);
      affected = 0; // Concurrent deletion after selection; update count no longer matches.
      assert.equal((await send(["a", "b"])).status, 400);
    } finally { await app.close(); }
  });
}
