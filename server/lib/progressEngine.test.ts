import assert from "node:assert/strict";
import test from "node:test";
import {
  darkOpusProgressPreset,
  darkOpusProgressPresetVersion1,
  darkOpusTargets
} from "../data/darkOpusProgressPreset.js";
import { evokerProgressPreset } from "../data/evokerProgressPreset.js";
import { eternalConfigs, eternalProgressPreset, eternalProgressPresetVersion2 } from "../data/eternalProgressPreset.js";
import { materialMasterSeeds } from "../data/gbfMasterSeed/materials.js";
import { progressMaterialNames } from "../data/progressMaterials.js";
import { findProgressPreset, progressPresets, resolveProgressPreset, type ProgressPreset } from "../data/progressPresets.js";
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

test("十天衆version 3は10人とLv150までの依存構造を持つ", () => {
  assert.equal(eternalConfigs.length, 10);
  assert.equal(new Set(eternalConfigs.map((config) => config.id)).size, 10);
  assert.equal(new Set(eternalConfigs.map((config) => config.weaponType)).size, 10);
  assert.deepEqual(validateProgressPreset(eternalProgressPreset), []);
  assert.equal(eternalProgressPreset.stages.at(-1)?.id, "transcendence-150");
  assert.deepEqual(
    collectRequiredStageIds(eternalProgressPreset, "transcendence-150"),
    eternalProgressPreset.stages.map((stage) => stage.id)
  );
  assert.equal(eternalProgressPreset.isAvailable, true);
});

test("十天衆version 3は雄偉者たちの矜持を交換素材へ展開しversion 2を維持する", () => {
  const version3 = resolveProgressPreset(eternalProgressPreset, "uno", { value: "火" });
  const version2 = resolveProgressPreset(eternalProgressPresetVersion2, "uno", { value: "火" });
  const requirements = (preset: ProgressPreset) => new Map(
    preset.stages.find((stage) => stage.id === "transcendence-150")
      ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount])
  );

  assert.deepEqual([...requirements(version3).entries()], [
    ["material-dark-residue", 30],
    ["material-black-wings", 30],
    ["material-cunning-horn", 30],
    ["material-azure-accolade", 1]
  ]);
  assert.deepEqual([...requirements(version2).entries()], [
    ["material-heroic-spirits-pride", 1]
  ]);
  assert.equal(eternalProgressPresetVersion2.isAvailable, false);
  assert.equal(findProgressPreset("eternals", 2), eternalProgressPresetVersion2);
  assert.equal(progressPresets.some((preset) => preset.id === "eternals" && preset.version === 2), false);
});

test("十天衆10人の検証済み超越素材は固定素材IDへ解決できる", () => {
  for (const config of eternalConfigs) {
    const resolved = resolveProgressPreset(eternalProgressPreset, config.id);
    assert.deepEqual(validateProgressPreset(resolved), [], config.name);
    for (const requirement of resolved.stages.flatMap((stage) => stage.requirements)) {
      assert.equal(progressMaterialNames[requirement.itemKey as keyof typeof progressMaterialNames], requirement.itemName);
    }
  }
});

test("光闇のLv110光輪を2属性へ40個ずつ分割する", () => {
  const song = resolveProgressPreset(eternalProgressPreset, "song");
  const seox = resolveProgressPreset(eternalProgressPreset, "seox");
  const haloRequirements = (preset: ProgressPreset) => preset.stages
    .find((stage) => stage.id === "transcendence-110")
    ?.requirements.filter((requirement) => requirement.itemKey.endsWith("-halo"));
  assert.deepEqual(haloRequirements(song)?.map(({ itemKey, requiredCount }) => [itemKey, requiredCount]), [
    ["material-fire-halo", 40],
    ["material-wind-halo", 40]
  ]);
  assert.deepEqual(haloRequirements(seox)?.map(({ itemKey, requiredCount }) => [itemKey, requiredCount]), [
    ["material-water-halo", 40],
    ["material-earth-halo", 40]
  ]);
});

test("40箱コースは選択した属性の素材へ置換する", () => {
  const fire = resolveProgressPreset(eternalProgressPreset, "tien", { value: "火" });
  const water = resolveProgressPreset(eternalProgressPreset, "tien", { value: "水" });
  const requirements = (resolved: ProgressPreset) => new Map(
    resolved.stages.find((stage) => stage.id === "forty-box-element-change")
      ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount])
  );
  assert.equal(requirements(fire).get("material-fire-orb"), 2_500);
  assert.equal(requirements(fire).get("material-true-anima-fire"), 30);
  assert.equal(requirements(water).get("material-water-orb"), 2_500);
  assert.equal(requirements(water).get("material-true-anima-water"), 30);
  assert.equal(requirements(water).has("material-fire-orb"), false);
});

test("黄金の依代は対象別の天星の欠片とジョブの証へ置換する", () => {
  const uno = resolveProgressPreset(eternalProgressPreset, "uno", { value: "火" });
  const gold = new Map(uno.stages.find((stage) => stage.id === "gold-relic-create")
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(gold.get("material-one-star-fragment"), 100);
  assert.equal(gold.get("material-holy-knight-distinction"), 30);
  assert.equal(gold.get("material-gold-brick"), 1);
});

test("十天衆10人と天星器6属性の全組み合わせに未解決素材がない", () => {
  for (const config of eternalConfigs) {
    for (const value of eternalProgressPreset.selectionOptions ?? []) {
      const resolved = resolveProgressPreset(eternalProgressPreset, config.id, { value });
      assert.deepEqual(validateProgressPreset(resolved), [], `${config.name}/${value}`);
      for (const requirement of resolved.stages.flatMap((stage) => stage.requirements)) {
        assert.equal(progressMaterialNames[requirement.itemKey as keyof typeof progressMaterialNames], requirement.itemName);
      }
      const emptyMaterialStages = resolved.stages.filter((stage) =>
        stage.kind === "stage"
        && stage.id !== "recruited"
        && stage.requirements.length === 0
      );
      assert.deepEqual(emptyMaterialStages, [], `${config.name}/${value}`);
    }
  }
});

test("天星器覚醒第5段階は選択属性80個・他属性20個を要求する", () => {
  const resolved = resolveProgressPreset(eternalProgressPreset, "seofon", { value: "風" });
  const requirements = new Map(resolved.stages.find((stage) => stage.id === "revenant-weapon-awaken-5")
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(requirements.get("material-storm-eye"), 80);
  assert.equal(requirements.get("material-prominence-reactor"), 20);
  assert.equal(requirements.get("material-sea-god-tail"), 20);
  assert.equal(requirements.get("material-creation-bud"), 20);
  assert.equal(requirements.get("material-primal-bit-light"), 20);
  assert.equal(requirements.get("material-black-fog-crystal"), 20);
});

test("進捗素材マスターの表示名は重複しない", () => {
  const names = Object.values(progressMaterialNames);
  assert.equal(new Set(names).size, names.length);
});

test("終末武器version 2は属性と加護を含む12武器とLv250完成までの依存構造を持つ", () => {
  assert.equal(darkOpusProgressPreset.id, "dark-opus");
  assert.equal(darkOpusProgressPreset.version, 2);
  assert.equal(darkOpusProgressPreset.isAvailable, true);
  assert.equal(darkOpusTargets.length, 12);
  assert.equal(new Set(darkOpusTargets.map((target) => target.id)).size, 12);
  assert.equal(new Set(darkOpusTargets.map((target) => target.name)).size, 12);
  assert.equal(darkOpusTargets.find((target) => target.id === "fire-magna")?.name, "永遠拒絶の大鎌：火マグナ");
  assert.equal(darkOpusTargets.find((target) => target.id === "fire-primal")?.name, "絶対否定の大鎌：火神石");
  assert.equal(darkOpusProgressPreset.stages.at(-1)?.id, "goal-lv250");
  assert.equal(darkOpusProgressPreset.fields, undefined);
  assert.equal(findProgressPreset("terminus-weapon"), darkOpusProgressPreset);
  assert.equal(findProgressPreset("terminus-weapon", 1), darkOpusProgressPresetVersion1);
});

test("終末武器12種すべてに未解決素材がない", () => {
  for (const target of darkOpusTargets) {
    const resolved = resolveProgressPreset(darkOpusProgressPreset, target.id);
    assert.deepEqual(validateProgressPreset(resolved), [], target.name);
    for (const requirement of resolved.stages.flatMap((stage) => stage.requirements)) {
      assert.equal(progressMaterialNames[requirement.itemKey as keyof typeof progressMaterialNames], requirement.itemName);
    }
  }
});

test("火属性終末武器は各段階の属性別素材へ置換する", () => {
  const resolved = resolveProgressPreset(darkOpusProgressPreset, "fire-magna", { count: 1, thirdSkill: "旧第3スキル" });
  const requirements = (stageId: string) => new Map(resolved.stages.find((stage) => stage.id === stageId)
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(requirements("weapon-obtain").get("material-element-fire"), 500);
  assert.equal(requirements("weapon-obtain").get("material-weapon-element-axe"), 255);
  assert.equal(requirements("weapon-uncap-4").get("material-shiva-magna-anima"), 10);
  assert.equal(requirements("transcendence-220").get("material-shiva-magna-anima"), 80);
  assert.equal(requirements("transcendence-220").get("material-wilnas-jewel"), 240);
  assert.equal(requirements("transcendence-230").get("material-star-sea-blade-shard"), 60);
  assert.equal(requirements("transcendence-230").get("material-ignis-bright"), 20);
  assert.equal(requirements("transcendence-240").get("material-celestial-grace-fire"), 1);
  assert.equal(requirements("transcendence-240").get("material-fire-halo"), 120);
});

test("光属性終末武器のブライトと光輪を火風へ分割する", () => {
  const resolved = resolveProgressPreset(darkOpusProgressPreset, "light-primal", { count: 1 });
  const requirements = (stageId: string) => new Map(resolved.stages.find((stage) => stage.id === stageId)
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(requirements("transcendence-230").get("material-ignis-bright"), 10);
  assert.equal(requirements("transcendence-230").get("material-ventosus-bright"), 10);
  assert.equal(requirements("transcendence-240").get("material-fire-halo"), 60);
  assert.equal(requirements("transcendence-240").get("material-wind-halo"), 60);
});

test("終末武器version 2は本数指定を受け取っても1本分だけ計算する", () => {
  const resolved = resolveProgressPreset(darkOpusProgressPreset, "dark-magna", { count: 3 });
  const requirements = (stageId: string) => new Map(resolved.stages.find((stage) => stage.id === stageId)
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(requirements("weapon-obtain").get("material-element-dark"), 500);
  assert.equal(requirements("weapon-obtain").get("material-weapon-element-katana"), 255);
  assert.equal(requirements("transcendence-250").get("material-end-bringing-black-feather"), 15);
});

test("終末武器version 2は第3スキルを段階と素材計算に含めない", () => {
  const resolved = resolveProgressPreset(darkOpusProgressPreset, "water-primal", { count: 1 });
  assert.equal(resolved.stages.some((stage) => stage.id === "third-skill"), false);
  assert.deepEqual(resolved.stages.at(-1)?.dependsOn, ["transcendence-250", "second-skill"]);
  const itemKeys = resolved.stages.flatMap((stage) => stage.requirements.map((requirement) => requirement.itemKey));
  assert.equal(itemKeys.includes("material-genesis-fragment"), false);
  assert.equal(itemKeys.includes("material-malice-fragment"), false);
});

test("終末武器version 1は第3スキル選択を既存目標用に維持する", () => {
  const legacy = resolveProgressPreset(darkOpusProgressPresetVersion1, "water-primal", { count: 1, thirdSkill: "旧第3スキル" });
  assert.deepEqual(
    legacy.stages.find((stage) => stage.id === "third-skill")?.requirements.map(({ itemKey, requiredCount }) => [itemKey, requiredCount]),
    [["material-dark-residue", 5], ["material-genesis-fragment", 30]]
  );
  assert.deepEqual(legacy.stages.at(-1)?.dependsOn, ["transcendence-250", "second-skill", "third-skill"]);
});

test("光属性の最終上限解放は共闘素材を火風へ15個ずつ分割する", () => {
  const resolved = resolveProgressPreset(eternalProgressPreset, "song", { value: "火" });
  const final = new Map(resolved.stages.find((stage) => stage.id === "final-uncap")
    ?.requirements.map((requirement) => [requirement.itemKey, requirement.requiredCount]));
  assert.equal(final.get("material-white-soul"), 2);
  assert.equal(final.get("material-coop-fire-book"), 15);
  assert.equal(final.get("material-coop-wind-book"), 15);
});
