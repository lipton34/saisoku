import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedWriteOrigin, requireWriteOrigin } from "./requireWriteOrigin.js";

test("same-origin and explicitly configured frontend can write", () => {
  assert.equal(isAllowedWriteOrigin("https://app.example.com", "https://app.example.com"), true);
  assert.equal(isAllowedWriteOrigin("http://localhost:5173", "http://localhost:4000", "http://localhost:5173"), true);
});
test("rejects cross-origin, subdomain, malformed, null and missing origins", () => {
  const own = "https://app.example.com";
  for (const origin of ["https://other.example.com", "https://app.example.com.evil.net", "http://app.example.com", "null", "", undefined, "https://app.example.com/path"]) {
    assert.equal(isAllowedWriteOrigin(origin, own), false, String(origin));
  }
});
test("middleware rejects cookie-bearing cross-origin POST before processing", () => {
  const prev = process.env.CLIENT_ORIGIN;
  delete process.env.CLIENT_ORIGIN;
  try {
    let status: number | undefined;
    let called = false;
    const res = { status(code: number) { status = code; return this; }, json(_data: unknown) { return this; } };
    const req = { method: "POST", protocol: "https", get: (header: string) => ({ origin: "https://untrusted.example.com", host: "app.example.com" } as Record<string, string>)[header] };
    requireWriteOrigin(req as never, res as never, () => { called = true; });
    assert.equal(status, 403);
    assert.equal(called, false);
  } finally { if (prev === undefined) delete process.env.CLIENT_ORIGIN; else process.env.CLIENT_ORIGIN = prev; }
});
test("middleware requires Origin for writes and accepts same-origin auth/logout", () => {
  const prev = process.env.CLIENT_ORIGIN;
  delete process.env.CLIENT_ORIGIN;
  try {
    let status: number | undefined;
    let called = false;
    const res = { status(code: number) { status = code; return this; }, json(_data: unknown) { return this; } };
    const makeReq = (method: string, origin?: string) => ({ method, protocol: "https", get: (header: string) => ({ origin, host: "app.example.com" } as Record<string, string | undefined>)[header] });
    requireWriteOrigin(makeReq("POST") as never, res as never, () => { called = true; });
    assert.equal(status, 403);
    assert.equal(called, false);
    status = undefined;
    requireWriteOrigin(makeReq("POST", "https://app.example.com") as never, res as never, () => { called = true; });
    assert.equal(status, undefined);
    assert.equal(called, true);
    called = false;
    requireWriteOrigin(makeReq("GET") as never, res as never, () => { called = true; });
    assert.equal(called, true);
  } finally { if (prev === undefined) delete process.env.CLIENT_ORIGIN; else process.env.CLIENT_ORIGIN = prev; }
});
