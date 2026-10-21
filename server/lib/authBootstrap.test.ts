import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { api, ApiRequestError } from "../../src/lib/api.js";

test("session check treats HTTP 401 as a typed auth error", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "ログインが必要です" }), { status: 401 }));
  try {
    await assert.rejects(api.me(), (error: unknown) => error instanceof ApiRequestError && error.status === 401);
  } finally {
    fetchMock.mock.restore();
  }
});

test("session check preserves HTTP 500 distinctly from 401", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "サーバーエラー" }), { status: 500 }));
  try {
    await assert.rejects(api.me(), (error: unknown) => error instanceof ApiRequestError && error.status === 500);
  } finally {
    fetchMock.mock.restore();
  }
});

test("session check preserves network failures", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new TypeError("Network disconnected"); });
  try {
    await assert.rejects(api.me(), (error: unknown) => error instanceof TypeError && !(error instanceof ApiRequestError));
  } finally {
    fetchMock.mock.restore();
  }
});

test("session check reads successful session response", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ user: null }), { status: 200 }));
  try {
    assert.deepEqual(await api.me(), { user: null });
  } finally {
    fetchMock.mock.restore();
  }
});
