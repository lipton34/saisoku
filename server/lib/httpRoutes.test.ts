import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import type { Server } from "node:http";
import { authRouter } from "../routes/auth.js";
import { buildsRouter, buildDraftsRouter } from "../routes/builds.js";

/** In-process HTTP requests: no production Supabase connection or Storage writes. */
async function startApp() {
  const app = express();
  app.use(express.json());
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

test("HTTP: logout returns 204 and clears session cookie", async () => {
  const app = await startApp();
  try {
    const response = await fetch(app.url + "/api/auth/logout", { method: "POST" });
    assert.equal(response.status, 204);
    assert.match(response.headers.get("set-cookie") ?? "", /saisoku_session=/);
  } finally { await app.close(); }
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

