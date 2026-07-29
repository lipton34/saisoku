import assert from "node:assert/strict";
import test from "node:test";
import { effectiveSubTaskDone } from "./goalSubTasks.js";

test("通常サブタスクは保存済みの完了状態を使用する", () => {
  assert.equal(effectiveSubTaskDone("standard", true, false, null), true);
  assert.equal(effectiveSubTaskDone("standard", false, true, true), false);
});

test("リンク項目は手動上書きがなければ自動判定を使用する", () => {
  assert.equal(effectiveSubTaskDone("round", false, true, null), true);
  assert.equal(effectiveSubTaskDone("progress", false, false, null), false);
});

test("リンク項目は手動完了と手動未完了を自動判定より優先する", () => {
  assert.equal(effectiveSubTaskDone("round", false, false, true), true);
  assert.equal(effectiveSubTaskDone("progress", false, true, false), false);
});
