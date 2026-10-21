import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { createAuthRateLimiter } from "./authRateLimit.js";

function attempt(limiter: ReturnType<typeof createAuthRateLimiter>, ip: string) {
  let status = 200;
  let nextCalled = false;
  const headers = new Map<string, string>();
  const req = { ip, socket: { remoteAddress: ip } } as Request;
  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    status(value: number) {
      status = value;
      return this;
    },
    json(_body: unknown) {
      return this;
    }
  } as unknown as Response;
  limiter.middleware(req, res, (() => { nextCalled = true; }) as NextFunction);
  return { status, nextCalled, headers };
}

test("limits repeated requests and responds with 429 and Retry-After", () => {
  const limiter = createAuthRateLimiter(2, 60_000);
  assert.equal(attempt(limiter, "192.0.2.1").nextCalled, true);
  assert.equal(attempt(limiter, "192.0.2.1").nextCalled, true);
  const blocked = attempt(limiter, "192.0.2.1");
  assert.equal(blocked.status, 429);
  assert.equal(blocked.nextCalled, false);
  assert.ok(Number(blocked.headers.get("Retry-After")) > 0);
});

test("isolates IPs and resets after successful authentication", () => {
  const limiter = createAuthRateLimiter(1, 60_000);
  attempt(limiter, "192.0.2.1");
  assert.equal(attempt(limiter, "192.0.2.1").status, 429);
  assert.equal(attempt(limiter, "192.0.2.2").nextCalled, true);
  limiter.reset("192.0.2.1");
  assert.equal(attempt(limiter, "192.0.2.1").nextCalled, true);
});

test("allows requests after the time window expires", async () => {
  const limiter = createAuthRateLimiter(1, 15);
  attempt(limiter, "192.0.2.3");
  assert.equal(attempt(limiter, "192.0.2.3").status, 429);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(attempt(limiter, "192.0.2.3").nextCalled, true);
});
