import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PINNED_PROGRESS_MATERIALS,
  pinnedMaterialKeysFromSelection,
  validatePinnedMaterialKeys
} from "./progressPinnedMaterials.js";

const known = new Set(Array.from({ length: 10 }, (_, index) => `material-${index + 1}`));

test("掲示素材は重複を除いて最大8件まで保存できる", () => {
  const result = validatePinnedMaterialKeys(
    ["material-1", "material-1", ...Array.from({ length: 7 }, (_, index) => `material-${index + 2}`)],
    known
  );
  assert.deepEqual(result.keys, Array.from({ length: MAX_PINNED_PROGRESS_MATERIALS }, (_, index) => `material-${index + 1}`));
  assert.equal(result.message, null);
});

test("掲示素材が8件を超える場合は拒否する", () => {
  const result = validatePinnedMaterialKeys(Array.from({ length: 9 }, (_, index) => `material-${index + 1}`), known);
  assert.equal(result.keys, null);
  assert.match(result.message ?? "", /8件まで/);
});

test("目標で使用しない素材は掲示できない", () => {
  const result = validatePinnedMaterialKeys(["unknown-material"], known);
  assert.equal(result.keys, null);
});

test("selectionから安全に掲示素材を読み取る", () => {
  assert.deepEqual(pinnedMaterialKeysFromSelection({ pinnedMaterialKeys: ["material-1", "material-1", "material-2"] }), ["material-1", "material-2"]);
  assert.deepEqual(pinnedMaterialKeysFromSelection({ pinnedMaterialKeys: "material-1" }), []);
});
