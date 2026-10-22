import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import cors from "cors";
import { requireWriteOrigin } from "./requireWriteOrigin.js";
import { authRouter } from "../routes/auth.js";

test("HTTP: cross-origin simple POST blocked, missing origin denied, same-origin logout works", async () => {
  const app = express();
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.use("/api", requireWriteOrigin);
  app.use("/api/auth", authRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const denied = await fetch(base + "/api/auth/logout", { method: "POST", headers: { Origin: "http://evil.example" } });
    assert.equal(denied.status, 403);
    const absent = await fetch(base + "/api/auth/logout", { method: "POST" });
    assert.equal(absent.status, 403);
    const allowed = await fetch(base + "/api/auth/logout", { method: "POST", headers: { Origin: base } });
    assert.equal(allowed.status, 204);
    const preflight = await fetch(base + "/api/auth/logout", { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" } });
    assert.equal(preflight.status, 204);
    const check = await fetch(base + "/api/auth/me");
    assert.equal(check.status, 200);
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
