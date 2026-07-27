import { progressMaterialNames, type ProgressMaterialKey } from "./progressMaterials.js";
import type { ProgressPreset, ProgressRequirement, ProgressStage } from "./progressPresets.js";

const elementConfigs = {
  fire: {
    name: "火", element: "material-element-fire", weaponElement: "material-weapon-element-axe",
    psyche: "material-psyche-fire", magna2: "material-shiva-magna-anima",
    jewel: "material-wilnas-jewel", grace: "material-gospel-grace-fire", celestialGrace: "material-celestial-grace-fire",
    revans: "material-star-sea-blade-shard", brights: [["material-ignis-bright", 20]], halos: [["material-fire-halo", 120]]
  },
  water: {
    name: "水", element: "material-element-water", weaponElement: "material-weapon-element-staff",
    psyche: "material-psyche-water", magna2: "material-europa-magna-anima",
    jewel: "material-wamdus-jewel", grace: "material-gospel-grace-water", celestialGrace: "material-celestial-grace-water",
    revans: "material-annihilation-remnant", brights: [["material-aqua-bright", 20]], halos: [["material-water-halo", 120]]
  },
  earth: {
    name: "土", element: "material-element-earth", weaponElement: "material-weapon-element-harp",
    psyche: "material-psyche-earth", magna2: "material-brodia-magna-anima",
    jewel: "material-galleon-jewel", grace: "material-gospel-grace-earth", celestialGrace: "material-celestial-grace-earth",
    revans: "material-machine-god-substrate", brights: [["material-terra-bright", 20]], halos: [["material-earth-halo", 120]]
  },
  wind: {
    name: "風", element: "material-element-wind", weaponElement: "material-weapon-element-spear",
    psyche: "material-psyche-wind", magna2: "material-grimnir-magna-anima",
    jewel: "material-ewiyar-jewel", grace: "material-gospel-grace-wind", celestialGrace: "material-celestial-grace-wind",
    revans: "material-dragon-destroying-crimson-blade", brights: [["material-ventosus-bright", 20]], halos: [["material-wind-halo", 120]]
  },
  light: {
    name: "光", element: "material-element-light", weaponElement: "material-weapon-element-sword",
    psyche: "material-psyche-light", magna2: "material-metatron-magna-anima",
    jewel: "material-lu-woh-jewel", grace: "material-gospel-grace-light", celestialGrace: "material-celestial-grace-light",
    revans: "material-arbitration-torn-cloth", brights: [["material-ignis-bright", 10], ["material-ventosus-bright", 10]],
    halos: [["material-fire-halo", 60], ["material-wind-halo", 60]]
  },
  dark: {
    name: "闇", element: "material-element-dark", weaponElement: "material-weapon-element-katana",
    psyche: "material-psyche-dark", magna2: "material-avatar-magna-anima",
    jewel: "material-fediel-jewel", grace: "material-gospel-grace-dark", celestialGrace: "material-celestial-grace-dark",
    revans: "material-progenitor-patterned-armor", brights: [["material-aqua-bright", 10], ["material-terra-bright", 10]],
    halos: [["material-water-halo", 60], ["material-earth-halo", 60]]
  }
} as const;

type ElementId = keyof typeof elementConfigs;

const weaponSuffix = {
  fire: "大鎌",
  water: "杖",
  earth: "竪琴",
  wind: "槍",
  light: "剣",
  dark: "太刀"
} as const satisfies Record<ElementId, string>;

export const darkOpusTargets = (Object.keys(elementConfigs) as ElementId[]).flatMap((element) => [
  { id: `${element}-magna`, name: `永遠拒絶の${weaponSuffix[element]}`, element, series: "magna" as const },
  { id: `${element}-primal`, name: `絶対否定の${weaponSuffix[element]}`, element, series: "primal" as const }
]);

type DarkOpusTarget = (typeof darkOpusTargets)[number];

function requirement(itemKey: ProgressMaterialKey, requiredCount: number, count: number): ProgressRequirement {
  return { itemKey, itemName: progressMaterialNames[itemKey], requiredCount: requiredCount * count };
}

function stage(
  id: string,
  name: string,
  groupId: string,
  dependsOn: string[],
  requirements: ProgressRequirement[],
  note?: string
): ProgressStage {
  return { id, name, groupId, kind: "stage", dependsOn, requirements, conditions: [], note };
}

function resolvedStages(target: DarkOpusTarget, selection: Record<string, unknown>): ProgressStage[] {
  const config = elementConfigs[target.element];
  const count = typeof selection.count === "number" && Number.isInteger(selection.count) && selection.count >= 1 && selection.count <= 10
    ? selection.count
    : 1;
  const thirdSkill = selection.thirdSkill === "超越後の新第3スキル" || selection.thirdSkill === "計算に含めない"
    ? selection.thirdSkill
    : "旧第3スキル";
  const r = (itemKey: ProgressMaterialKey, requiredCount: number) => requirement(itemKey, requiredCount, count);
  const stages: ProgressStage[] = [
    stage("weapon-obtain", "3凸交換", "weapon", [], [
      r(config.element, 500),
      r(config.weaponElement, 255),
      r("material-darkness-material", 5)
    ]),
    stage("weapon-uncap-4", "4凸", "weapon", ["weapon-obtain"], [
      r("material-darkness-material", 5),
      r("material-silver-centrum", 5),
      r("material-conqueror-merit", 100),
      r("material-supreme-merit", 10),
      r(config.psyche, 30),
      r(config.magna2, 10)
    ]),
    stage("second-skill", "第2スキル", "skills", ["weapon-uncap-4"], [
      r("material-darkness-material", 5)
    ], "4種類のペンデュラムは必要素材が共通です。"),
    stage("weapon-uncap-5", "5凸", "weapon", ["weapon-uncap-4"], [
      r(config.grace, 1),
      r("material-dark-residue", 5),
      r("material-gold-brick", 1),
      r("material-bahamut-purple-horn", 50),
      r("material-hollow-key", 50),
      r("material-omega-unit", 50),
      r("material-astaroth-anima", 30)
    ]),
    stage("transcendence-210", "限界超越Lv210", "transcendence", ["weapon-uncap-5"], [
      r("material-dark-residue", 60),
      r("material-black-wings", 60),
      r("material-cunning-horn", 60),
      r("material-damascus-crystal", 20),
      r("material-supreme-merit", 80)
    ]),
    stage("transcendence-220", "限界超越Lv220", "transcendence", ["transcendence-210"], [
      r("material-new-world-quartz", 20),
      r(config.magna2, 80),
      r(config.jewel, 240),
      r(config.weaponElement, 1_200),
      r(config.element, 1_200)
    ]),
    stage("transcendence-230", "限界超越Lv230", "transcendence", ["transcendence-220"], [
      r("material-end-bringing-black-feather", 10),
      r(config.revans, 60),
      ...config.brights.map(([key, amount]) => r(key, amount))
    ]),
    stage("transcendence-240", "限界超越Lv240", "transcendence", ["transcendence-230"], [
      r("material-end-bringing-black-feather", 15),
      r(config.celestialGrace, 1),
      r("material-azure-accolade", 1),
      r(config.weaponElement, 1_200),
      r(config.element, 1_200),
      ...config.halos.map(([key, amount]) => r(key, amount))
    ]),
    stage("transcendence-250", "限界超越Lv250", "transcendence", ["transcendence-240"], [
      r("material-end-bringing-black-feather", 15),
      r("material-eternity-sand", 1),
      r("material-gold-brick", 1),
      r("material-ultima-memory", 15),
      r("material-crystal-of-principle", 15)
    ])
  ];

  let thirdSkillStageId: string | undefined;
  if (thirdSkill === "旧第3スキル") {
    thirdSkillStageId = "third-skill";
    stages.push(stage(thirdSkillStageId, "第3スキル", "skills", ["weapon-uncap-5"], [
      r("material-dark-residue", 5),
      r("material-genesis-fragment", 30)
    ], "渾身・背水・進境のペンデュラムは必要素材が共通です。"));
  } else if (thirdSkill === "超越後の新第3スキル") {
    thirdSkillStageId = "third-skill";
    stages.push(stage(thirdSkillStageId, "第3スキル", "skills", ["transcendence-210"], [
      r("material-end-bringing-black-feather", 5),
      r("material-malice-fragment", 30)
    ], "絶涯・窮理・天髄のペンデュラムは必要素材が共通です。"));
  } else {
    stages.push(stage("third-skill", "第3スキル（計算対象外）", "skills", ["weapon-uncap-5"], [],
      "第3スキルの素材は必要数とLv250完成条件へ含めません。"));
  }

  const stageOrder = [
    "weapon-obtain",
    "weapon-uncap-4",
    "second-skill",
    "weapon-uncap-5",
    "third-skill",
    "transcendence-210",
    "transcendence-220",
    "transcendence-230",
    "transcendence-240",
    "transcendence-250"
  ];
  stages.sort((a, b) => stageOrder.indexOf(a.id) - stageOrder.indexOf(b.id));

  stages.push({
    id: "goal-lv250",
    name: "Lv250完成",
    groupId: "transcendence",
    kind: "milestone",
    dependsOn: ["transcendence-250", "second-skill", ...(thirdSkillStageId ? [thirdSkillStageId] : [])],
    requirements: [],
    conditions: []
  });
  return stages;
}

export const darkOpusProgressPreset: ProgressPreset = {
  id: "dark-opus",
  version: 1,
  name: "終末武器",
  targetLabel: "終末武器",
  targets: darkOpusTargets.map(({ id, name }) => ({ id, name })),
  fields: [
    { id: "count", label: "本数", type: "integer", min: 1, max: 10, defaultValue: 1 },
    {
      id: "thirdSkill",
      label: "第3スキル",
      type: "select",
      options: ["旧第3スキル", "超越後の新第3スキル", "計算に含めない"],
      defaultValue: "旧第3スキル"
    }
  ],
  groups: [
    { id: "weapon", name: "本体強化", sortOrder: 1 },
    { id: "skills", name: "スキル", sortOrder: 2 },
    { id: "transcendence", name: "限界超越", sortOrder: 3 }
  ],
  stages: resolvedStages(darkOpusTargets[0], { count: 1, thirdSkill: "旧第3スキル" })
    .map((item) => ({ ...item, requirements: [] })),
  resolveStages: (targetId, selection) => {
    const target = darkOpusTargets.find((item) => item.id === targetId);
    return target ? resolvedStages(target, selection) : [];
  },
  isAvailable: true
};
