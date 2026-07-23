import assert from "node:assert/strict";
import test from "node:test";
import { evokerProgressPreset } from "../data/evokerProgressPreset.js";
import { materialMasterSeeds } from "../data/gbfMasterSeed/materials.js";
import { progressMaterialNames } from "../data/progressMaterials.js";
import { resolveProgressPreset, type ProgressPreset } from "../data/progressPresets.js";
import { calculateProgress, collectRequiredStageIds, validateCompletedStageIds, validateProgressPreset } from "./progressEngine.js";

const preset: ProgressPreset = {
  id: "test",
  version: 1,
  name: "テスト",
  targetLabel: "対象",
  targets: [{ id: "target", name: "対象" }],
  groups: [
    { id: "base", name: "前提", sortOrder: 1 },
    { id: "branch", name: "並行", sortOrder: 2 }
  ],
  stages: [
    { id: "a", name: "A", groupId: "base", kind: "stage", dependsOn: [], requirements: [{ itemKey: "x", itemName: "X", requiredCount: 2 }], conditions: [] },
    { id: "b", name: "B", groupId: "base", kind: "stage", dependsOn: ["a"], requirements: [{ itemKey: "x", itemName: "X", requiredCount: 3 }], conditions: [] },
    { id: "c", name: "C", groupId: "branch", kind: "stage", dependsOn: ["a"], requirements: [{ itemKey: "y", itemName: "Y", requiredCount: 4 }], conditions: [] },
    { id: "done", name: "完了", groupId: "branch", kind: "milestone", dependsOn: ["b", "c"], requirements: [], conditions: [] }
  ],
  isAvailable: true
};

test("依存中継点を重複なく抽出する", () => {
  assert.deepEqual(collectRequiredStageIds(preset, "done"), ["a", "b", "c", "done"]);
});

test("完了済みを除外して同一素材を合算する", () => {
  const result = calculateProgress(preset, "done", ["a"], new Map([["x", 1], ["y", 10]]));
  assert.deepEqual(result.pendingStageIds, ["b", "c"]);
  assert.deepEqual(result.requirements, [
    { itemKey: "x", itemName: "X", requiredCount: 3, ownedCount: 1, shortage: 2 },
    { itemKey: "y", itemName: "Y", requiredCount: 4, ownedCount: 10, shortage: 0 }
  ]);
});

test("前提を飛ばした完了状態を拒否する", () => {
  assert.deepEqual(validateCompletedStageIds(preset, ["b"]), [{ stageId: "b", missingDependencyIds: ["a"] }]);
  assert.deepEqual(validateCompletedStageIds(preset, ["a", "b"]), []);
});

test("循環参照を検出する", () => {
  const cyclic: ProgressPreset = {
    ...preset,
    stages: preset.stages.map((stage) => stage.id === "a" ? { ...stage, dependsOn: ["b"] } : stage)
  };
  assert.ok(validateProgressPreset(cyclic).some((error) => error.includes("循環")));
});

test("十賢者10人の定義に未解決素材や構造エラーがない", () => {
  for (const target of evokerProgressPreset.targets) {
    const resolved = resolveProgressPreset(evokerProgressPreset, target.id);
    assert.deepEqual(validateProgressPreset(resolved), [], target.name);
    for (const stage of resolved.stages) {
      for (const requirement of stage.requirements) {
        assert.equal(progressMaterialNames[requirement.itemKey as keyof typeof progressMaterialNames], requirement.itemName);
      }
    }
  }
});

test("アラナンの礎武器交換から5凸までの調査合計と一致する", () => {
  const resolved = resolveProgressPreset(evokerProgressPreset, "aranan");
  const completed = collectRequiredStageIds(resolved, "recruited").filter((id) => id !== "recruited").concat("recruited");
  const result = calculateProgress(resolved, "foundation-weapon-uncap-5", completed, new Map());
  const totals = new Map(result.requirements.map((item) => [item.itemKey, item.requiredCount]));
  assert.equal(totals.get("material-new-world-quartz"), 90);
  assert.equal(totals.get("material-ignis-bright"), 230);
  assert.equal(totals.get("material-sun-veritas"), 640);
  assert.equal(totals.get("material-verum-proof-fire"), 700);
  assert.equal(totals.get("material-astra-fire"), 440);
  assert.equal(totals.get("material-sun-idea"), 330);
});

test("光属性の特殊分割を段階別に保持する", () => {
  const resolved = resolveProgressPreset(evokerProgressPreset, "geisenborger");
  const obtain = resolved.stages.find((stage) => stage.id === "foundation-weapon-obtain");
  const uncap1 = resolved.stages.find((stage) => stage.id === "foundation-weapon-uncap-1");
  assert.deepEqual(obtain?.requirements.filter((item) => item.itemKey.includes("bright")).map((item) => item.requiredCount), [3, 3]);
  assert.deepEqual(uncap1?.requirements.filter((item) => item.itemKey.includes("bright")).map((item) => item.requiredCount), [7, 7]);
});

test("進捗素材マスターは固定ID一覧と一致する", () => {
  assert.equal(materialMasterSeeds.length, Object.keys(progressMaterialNames).length);
  assert.equal(new Set(materialMasterSeeds.map((item) => item.id)).size, materialMasterSeeds.length);
  for (const item of materialMasterSeeds) {
    assert.equal(progressMaterialNames[item.id as keyof typeof progressMaterialNames], item.name);
  }
});
