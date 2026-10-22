import assert from "node:assert/strict";
import test from "node:test";
import { checkInviteCode } from "./inviteCode.js";

test("production without invite-code fails closed even when submitted code is empty", () => {
  assert.equal(checkInviteCode("production", undefined, ""), "unavailable");
  assert.equal(checkInviteCode("production", "   ", "anything"), "unavailable");
});
test("production only accepts the configured invite code", () => {
  assert.equal(checkInviteCode("production", "secret", "wrong"), "invalid");
  assert.equal(checkInviteCode("production", "secret", "secret"), "allowed");
});
test("development and test retain existing optional invite-code behavior", () => {
  assert.equal(checkInviteCode("development", undefined, ""), "allowed");
  assert.equal(checkInviteCode("test", undefined, ""), "allowed");
  assert.equal(checkInviteCode("test", "secret", "wrong"), "invalid");
});
