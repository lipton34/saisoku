import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import type { Server } from "node:http";
import { authRouter } from "../routes/auth.js";
import { buildsRouter, buildDraftsRouter } from "../routes/builds.js";
import { prisma } from "../prisma.js";

/** In-process HTTP requests: no production Supabase connection or Storage writes. */
async function startApp(withUser = false) {
  const app = express();
  app.use(express.json());
  if (withUser) {
    app.use((req, _res, next) => {
      req.user = { id: "test-user", username: "test", displayName: null };
      next();
    });
  }
  app.use("/api/auth", authRouter);
  app.use("/api/builds", buildsRouter);
  app.use("/api/build-drafts", buildDraftsRouter);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: error instanceof Error ? error.message : "error" });
  });
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

test("HTTP: unauthenticated session check returns user=null", async () => {
  const app = await startApp();
  try {
    const response = await fetch(app.url + "/api/auth/me");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { user: null });
  } finally { await app.close(); }
});

test("HTTP: malformed registration returns 400 without DB write", async () => {
  const app = await startApp();
  try {
    const response = await fetch(app.url + "/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "ab", password: "short" })
    });
    assert.equal(response.status, 400);
  } finally { await app.close(); }
});

test("HTTP: unknown login returns 401 instead of 500", async () => {
  const lookup = mock.method(prisma.user, "findUnique", async () => null);
  const app = await startApp();
  try {
    const response = await fetch(app.url + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "missing-account", password: "incorrect" })
    });
    assert.equal(response.status, 401);
    assert.equal(lookup.mock.callCount(), 1);
  } finally {
    lookup.mock.restore();
    await app.close();
  }
});

test("HTTP: unauthenticated image routes return 401", async () => {
  const app = await startApp();
  try {
    for (const path of ["/api/builds/post-id/images", "/api/build-drafts/draft-id/images"]) {
      const response = await fetch(app.url + path, { method: "POST" });
      assert.equal(response.status, 401);
    }
  } finally { await app.close(); }
});

test("HTTP: authorized post and draft reject absent image with 400", async () => {
  const postLookup = mock.method(prisma.buildPost, "findFirst", async () => ({ id: "post-id" }));
  const draftLookup = mock.method(prisma.buildDraft, "findFirst", async () => ({ id: "draft-id" }));
  const app = await startApp(true);
  try {
    for (const path of ["/api/builds/post-id/images", "/api/build-drafts/draft-id/images"]) {
      const response = await fetch(app.url + path, { method: "POST" });
      assert.equal(response.status, 400);
    }
    assert.equal(postLookup.mock.callCount(), 1);
    assert.equal(draftLookup.mock.callCount(), 1);
  } finally {
    postLookup.mock.restore();
    draftLookup.mock.restore();
    await app.close();
  }
});
