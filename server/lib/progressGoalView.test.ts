import assert from "node:assert/strict";
import test from "node:test";
import { dependencyClosure, materialCategory, materialTabs, progressGroupDescriptions } from "../../src/lib/progressGoalView.js";
import type { ProgressPreset } from "../../src/lib/apiTypes.js";

test("material category rules keep the original classifications", () => {
  assert.equal(materialCategory("sephira-stone"), "arcarum");
  assert.equal(materialCategory("fire-anima"), "battle");
  assert.equal(materialCategory("unknown-material"), "other");
  assert.equal(materialTabs.length, 5);
  assert.equal(progressGroupDescriptions["domain"], "第1解放から全解放まで");
});

test("stage dependency closure includes transitive dependencies and handles cycles", () => {
  const preset = { stages: [
    { id: "a", dependsOn: ["b"] },
    { id: "b", dependsOn: ["c"] },
    { id: "c", dependsOn: ["a"] }
  ] } as ProgressPreset;
  assert.deepEqual([...dependencyClosure(preset, "a")], ["a", "b", "c"]);
  assert.deepEqual([...dependencyClosure(preset, "missing")], []);
});
