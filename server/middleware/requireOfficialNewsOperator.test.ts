import assert from "node:assert/strict";
import test from "node:test";
import { canRunOfficialNewsFetch, requireOfficialNewsOperator } from "./requireOfficialNewsOperator.js";

test("operator allowlist rejects unset, empty and unrelated users", () => {
  assert.equal(canRunOfficialNewsFetch("owner", undefined), false);
  assert.equal(canRunOfficialNewsFetch("owner", ""), false);
  assert.equal(canRunOfficialNewsFetch(undefined, "owner"), false);
  assert.equal(canRunOfficialNewsFetch("other", "owner,admin"), false);
  assert.equal(canRunOfficialNewsFetch("own", "owner,admin"), false);
});

test("operator allowlist accepts exact user IDs and ignores padding", () => {
  assert.equal(canRunOfficialNewsFetch("admin", " owner, admin ,"), true);
  assert.equal(canRunOfficialNewsFetch("owner", "owner,admin"), true);
});

test("middleware returns 403 without executing expensive operation", () => {
  const previous = process.env.OFFICIAL_NEWS_FETCH_OPERATOR_IDS;
  process.env.OFFICIAL_NEWS_FETCH_OPERATOR_IDS = "owner";
  try {
    let status = 0;
    let payload: unknown;
    let invoked = false;
    const res = {
      status(code: number) { status = code; return this; },
      json(value: unknown) { payload = value; return this; }
    };
    requireOfficialNewsOperator({ user: { id: "guest" } } as never, res as never, () => { invoked = true; });
    assert.equal(status, 403);
    assert.equal((payload as { ok: boolean }).ok, false);
    assert.equal(invoked, false);
    requireOfficialNewsOperator({ user: { id: "owner" } } as never, res as never, () => { invoked = true; });
    assert.equal(invoked, true);
  } finally {
    if (previous === undefined) delete process.env.OFFICIAL_NEWS_FETCH_OPERATOR_IDS;
    else process.env.OFFICIAL_NEWS_FETCH_OPERATOR_IDS = previous;
  }
});

test("middleware returns 401 when unauthenticated", () => {
  let status = 0;
  requireOfficialNewsOperator({} as never, { status(code: number) { status = code; return { json() {} }; } } as never, () => assert.fail("should not continue"));
  assert.equal(status, 401);
});
