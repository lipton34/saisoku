import { progressMaterialNames, type ProgressMaterialKey } from "./progressMaterials.js";
import type { ProgressPreset, ProgressRequirement, ProgressStage } from "./progressPresets.js";

export const draconicTargets = [
  {
    id: "fire",
    name: "雄渾と灼熱の調べ：火",
    element: "material-element-fire",
    weaponElement: "material-weapon-element-harp",
    radiance: "material-radiance-fire",
    dragonMaterial: "material-ignite-rubble",
    scale: "material-fire-scale"
  },
  {
    id: "water",
    name: "溟渤と激流の裁き：水",
    element: "material-element-water",
    weaponElement: "material-weapon-element-axe",
    radiance: "material-radiance-water",
    dragonMaterial: "material-abyssal-tragedy",
    scale: "material-water-scale"
  },
  {
    id: "earth",
    name: "豊穣と恩愛の寿ぎ：土",
    element: "material-element-earth",
    weaponElement: "material-weapon-element-bow",
    radiance: "material-radiance-earth",
    dragonMaterial: "material-insular-core",
    scale: "material-earth-scale"
  },
  {
    id: "wind",
    name: "狂飆と至高の祈り：風",
    element: "material-element-wind",
    weaponElement: "material-weapon-element-staff",
    radiance: "material-radiance-wind",
    dragonMaterial: "material-gale-rock",
    scale: "material-wind-scale"
  },
  {
    id: "light",
    name: "叡智と廻生の煌き：光",
    element: "material-element-light",
    weaponElement: "material-weapon-element-katana",
    radiance: "material-radiance-light",
    dragonMaterial: "material-thunder-wheel",
    scale: "material-white-dragon-scale"
  },
  {
    id: "dark",
    name: "暁闇と葬送の蝕み：闇",
    element: "material-element-dark",
    weaponElement: "material-weapon-element-gun",
    radiance: "material-radiance-dark",
    dragonMaterial: "material-todestrieb",
    scale: "material-dark-scale"
  }
] as const;

type DraconicTarget = (typeof draconicTargets)[number];

function requirement(itemKey: ProgressMaterialKey, requiredCount: number): ProgressRequirement {
  return { itemKey, itemName: progressMaterialNames[itemKey], requiredCount };
}

function stage(
  id: string,
  name: string,
  dependsOn: string[],
  requirements: ProgressRequirement[],
  note?: string
): ProgressStage {
  return { id, name, groupId: "weapon", kind: "stage", dependsOn, requirements, conditions: [], note };
}

function resolvedStages(target: DraconicTarget): ProgressStage[] {
  const r = requirement;
  return [
    stage("weapon-obtain", "3凸交換", [], [
      r(target.element, 666),
      r(target.weaponElement, 500),
      r("material-true-dragon-golden-scale", 30)
    ]),
    stage("weapon-uncap-4", "4凸", ["weapon-obtain"], [
      r("material-true-dragon-golden-scale", 30),
      r("material-silver-centrum", 5),
      r("material-champion-merit", 100),
      r("material-conqueror-merit", 50),
      r(target.radiance, 30)
    ]),
    stage("weapon-uncap-5", "5凸", ["weapon-uncap-4"], [
      r(target.weaponElement, 200),
      r(target.dragonMaterial, 15),
      r("material-damascus-crystal", 5),
      r(target.scale, 350),
      r("material-malice-fragment", 10),
      r("material-supreme-merit", 10)
    ], "第2・第3スキルのテルマ交換素材は計算に含めません。"),
    stage("weapon-origin", "オリジン化", ["weapon-uncap-5"], [
      r(target.weaponElement, 1_000),
      r(target.element, 1_000),
      r("material-damascus-crystal", 15),
      r("material-supreme-merit", 10),
      r(target.dragonMaterial, 100),
      r("material-crystal-of-principle", 20),
      r("material-eternity-sand", 1)
    ]),
    {
      id: "goal-origin",
      name: "オリジン化完成",
      groupId: "weapon",
      kind: "milestone",
      dependsOn: ["weapon-origin"],
      requirements: [],
      conditions: []
    }
  ];
}

export const draconicProgressPreset: ProgressPreset = {
  id: "draconic",
  version: 1,
  name: "ドラゴニックウェポン",
  targetLabel: "ドラゴニックウェポン",
  targets: draconicTargets.map(({ id, name }) => ({ id, name })),
  groups: [{ id: "weapon", name: "本体強化", sortOrder: 1 }],
  stages: resolvedStages(draconicTargets[0]).map((stage) => ({ ...stage, requirements: [] })),
  resolveStages: (targetId) => {
    const target = draconicTargets.find((item) => item.id === targetId);
    return target ? resolvedStages(target) : [];
  },
  isAvailable: true
};
