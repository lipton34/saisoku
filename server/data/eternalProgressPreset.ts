import { progressMaterialNames, type ProgressMaterialKey } from "./progressMaterials.js";
import type { ProgressPreset, ProgressRequirement, ProgressStage } from "./progressPresets.js";

export const eternalConfigs = [
  { id: "uno", name: "ウーノ", element: "water", weaponType: "槍", revenantWeapon: "一伐槍", shard: "material-spear-shard", rusted: "material-rusted-spear", revenant3: "material-three-star-revenant-spear", distinction: "material-holy-knight-distinction", starFragment: "material-one-star-fragment", weaponElement: "material-weapon-element-spear", magna140: "material-black-kirin-magna-anima", brights: [["material-aqua-bright", 30]] },
  { id: "song", name: "ソーン", element: "light", weaponType: "弓", revenantWeapon: "二王弓", shard: "material-bow-shard", rusted: "material-rusted-bow", revenant3: "material-three-star-revenant-bow", distinction: "material-marksman-distinction", starFragment: "material-two-star-fragment", weaponElement: "material-weapon-element-bow", magna140: "material-yellow-dragon-magna-anima", brights: [["material-ignis-bright", 15], ["material-ventosus-bright", 15]] },
  { id: "threo", name: "サラーサ", element: "earth", weaponType: "斧", revenantWeapon: "三寅斧", shard: "material-axe-shard", rusted: "material-rusted-axe", revenant3: "material-three-star-revenant-axe", distinction: "material-gladiator-distinction", starFragment: "material-three-star-fragment", weaponElement: "material-weapon-element-axe", magna140: "material-black-kirin-magna-anima", brights: [["material-terra-bright", 30]] },
  { id: "feower", name: "カトル", element: "water", weaponType: "短剣", revenantWeapon: "四天刃", shard: "material-dagger-shard", rusted: "material-rusted-dagger", revenant3: "material-three-star-revenant-dagger", distinction: "material-fencer-distinction", starFragment: "material-four-star-fragment", weaponElement: "material-weapon-element-dagger", magna140: "material-black-kirin-magna-anima", brights: [["material-aqua-bright", 30]] },
  { id: "fif", name: "フュンフ", element: "light", weaponType: "杖", revenantWeapon: "五神杖", shard: "material-staff-shard", rusted: "material-rusted-staff", revenant3: "material-three-star-revenant-staff", distinction: "material-cleric-distinction", starFragment: "material-five-star-fragment", weaponElement: "material-weapon-element-staff", magna140: "material-yellow-dragon-magna-anima", brights: [["material-ignis-bright", 15], ["material-ventosus-bright", 15]] },
  { id: "seox", name: "シス", element: "dark", weaponType: "格闘", revenantWeapon: "六崩拳", shard: "material-melee-shard", rusted: "material-rusted-melee", revenant3: "material-three-star-revenant-melee", distinction: "material-grappler-distinction", starFragment: "material-six-star-fragment", weaponElement: "material-weapon-element-melee", magna140: "material-black-kirin-magna-anima", brights: [["material-aqua-bright", 15], ["material-terra-bright", 15]] },
  { id: "seofon", name: "シエテ", element: "wind", weaponType: "剣", revenantWeapon: "七星剣", shard: "material-sword-shard", rusted: "material-rusted-sword", revenant3: "material-three-star-revenant-sword", distinction: "material-sword-master-distinction", starFragment: "material-seven-star-fragment", weaponElement: "material-weapon-element-sword", magna140: "material-yellow-dragon-magna-anima", brights: [["material-ventosus-bright", 30]] },
  { id: "eahta", name: "オクトー", element: "earth", weaponType: "刀", revenantWeapon: "八命切", shard: "material-katana-shard", rusted: "material-rusted-katana", revenant3: "material-three-star-revenant-katana", distinction: "material-samurai-distinction", starFragment: "material-eight-star-fragment", weaponElement: "material-weapon-element-katana", magna140: "material-black-kirin-magna-anima", brights: [["material-terra-bright", 30]] },
  { id: "niyon", name: "ニオ", element: "wind", weaponType: "楽器", revenantWeapon: "九界琴", shard: "material-harp-shard", rusted: "material-rusted-harp", revenant3: "material-three-star-revenant-harp", distinction: "material-minstrel-distinction", starFragment: "material-nine-star-fragment", weaponElement: "material-weapon-element-harp", magna140: "material-yellow-dragon-magna-anima", brights: [["material-ventosus-bright", 30]] },
  { id: "tien", name: "エッセル", element: "fire", weaponType: "銃", revenantWeapon: "十狼雷", shard: "material-gun-shard", rusted: "material-rusted-gun", revenant3: "material-three-star-revenant-gun", distinction: "material-bandit-distinction", starFragment: "material-ten-star-fragment", weaponElement: "material-weapon-element-gun", magna140: "material-yellow-dragon-magna-anima", brights: [["material-ignis-bright", 30]] }
] as const;

type EternalConfig = (typeof eternalConfigs)[number];

const elementMaterials = {
  fire: { orb: "material-fire-orb", gene: "material-fire-gene", dragon: "material-ignite-rubble", dragonJewel: "material-wilnas-jewel", magna2: "material-shiva-magna-anima", psyche: "material-psyche-fire", element: "material-element-fire", radiance: "material-radiance-fire", soul: "material-white-soul", coopBooks: [["material-coop-fire-book", 30]], halos: [["material-fire-halo", 80]] },
  water: { orb: "material-water-orb", gene: "material-water-gene", dragon: "material-abyssal-tragedy", dragonJewel: "material-wamdus-jewel", magna2: "material-europa-magna-anima", psyche: "material-psyche-water", element: "material-element-water", radiance: "material-radiance-water", soul: "material-black-soul", coopBooks: [["material-coop-water-book", 30]], halos: [["material-water-halo", 80]] },
  earth: { orb: "material-earth-orb", gene: "material-earth-gene", dragon: "material-insular-core", dragonJewel: "material-galleon-jewel", magna2: "material-brodia-magna-anima", psyche: "material-psyche-earth", element: "material-element-earth", radiance: "material-radiance-earth", soul: "material-black-soul", coopBooks: [["material-coop-earth-book", 30]], halos: [["material-earth-halo", 80]] },
  wind: { orb: "material-wind-orb", gene: "material-wind-gene", dragon: "material-gale-rock", dragonJewel: "material-ewiyar-jewel", magna2: "material-grimnir-magna-anima", psyche: "material-psyche-wind", element: "material-element-wind", radiance: "material-radiance-wind", soul: "material-white-soul", coopBooks: [["material-coop-wind-book", 30]], halos: [["material-wind-halo", 80]] },
  light: { orb: "material-light-orb", gene: "material-light-gene", dragon: "material-thunder-wheel", dragonJewel: "material-lu-woh-jewel", magna2: "material-metatron-magna-anima", psyche: "material-psyche-light", element: "material-element-light", radiance: "material-radiance-light", soul: "material-white-soul", coopBooks: [["material-coop-fire-book", 15], ["material-coop-wind-book", 15]], halos: [["material-fire-halo", 40], ["material-wind-halo", 40]] },
  dark: { orb: "material-dark-orb", gene: "material-dark-gene", dragon: "material-todestrieb", dragonJewel: "material-fediel-jewel", magna2: "material-avatar-magna-anima", psyche: "material-psyche-dark", element: "material-element-dark", radiance: "material-radiance-dark", soul: "material-black-soul", coopBooks: [["material-coop-water-book", 15], ["material-coop-earth-book", 15]], halos: [["material-water-halo", 40], ["material-earth-halo", 40]] }
} as const satisfies Record<EternalConfig["element"], {
  orb: ProgressMaterialKey;
  gene: ProgressMaterialKey;
  dragon: ProgressMaterialKey;
  dragonJewel: ProgressMaterialKey;
  magna2: ProgressMaterialKey;
  psyche: ProgressMaterialKey;
  element: ProgressMaterialKey;
  radiance: ProgressMaterialKey;
  soul: ProgressMaterialKey;
  coopBooks: readonly (readonly [ProgressMaterialKey, number])[];
  halos: readonly (readonly [ProgressMaterialKey, number])[];
}>;

const selectionMaterials = {
  火: { orb: "material-fire-orb", upperOrb: "material-fire-upper-orb", book: "material-fire-book", scroll: "material-fire-scroll", gene: "material-fire-gene", scale: "material-fire-scale", anima: "material-colossus-anima", trueAnima: "material-true-anima-fire", magnaDrop: "material-prominence-reactor" },
  水: { orb: "material-water-orb", upperOrb: "material-water-upper-orb", book: "material-water-book", scroll: "material-water-scroll", gene: "material-water-gene", scale: "material-water-scale", anima: "material-leviathan-anima", trueAnima: "material-true-anima-water", magnaDrop: "material-sea-god-tail" },
  土: { orb: "material-earth-orb", upperOrb: "material-earth-upper-orb", book: "material-earth-book", scroll: "material-earth-scroll", gene: "material-earth-gene", scale: "material-earth-scale", anima: "material-yggdrasil-anima", trueAnima: "material-true-anima-earth", magnaDrop: "material-creation-bud" },
  風: { orb: "material-wind-orb", upperOrb: "material-wind-upper-orb", book: "material-wind-book", scroll: "material-wind-scroll", gene: "material-wind-gene", scale: "material-wind-scale", anima: "material-tiamat-anima", trueAnima: "material-true-anima-wind", magnaDrop: "material-storm-eye" },
  光: { orb: "material-light-orb", upperOrb: "material-light-upper-orb", book: "material-light-book", scroll: "material-light-scroll", gene: "material-light-gene", scale: "material-white-dragon-scale", anima: "material-luminiera-anima", trueAnima: "material-true-anima-light", magnaDrop: "material-primal-bit-light" },
  闇: { orb: "material-dark-orb", upperOrb: "material-dark-upper-orb", book: "material-dark-book", scroll: "material-dark-scroll", gene: "material-dark-gene", scale: "material-dark-scale", anima: "material-celeste-anima", trueAnima: "material-true-anima-dark", magnaDrop: "material-black-fog-crystal" }
} as const satisfies Record<string, Record<"orb" | "upperOrb" | "book" | "scroll" | "gene" | "scale" | "anima" | "trueAnima" | "magnaDrop", ProgressMaterialKey>>;

function r(itemKey: ProgressMaterialKey, requiredCount: number): ProgressRequirement {
  return { itemKey, itemName: progressMaterialNames[itemKey], requiredCount };
}

function stage(id: string, name: string, groupId: string, dependsOn: string[], requirements: ProgressRequirement[] = [], note?: string): ProgressStage {
  return { id, name, groupId, kind: "stage", dependsOn, requirements, conditions: [], note };
}

function stagesFor(
  config: EternalConfig,
  selection: Record<string, unknown> = {},
  expandExchangeMaterials = true
): ProgressStage[] {
  const keys = elementMaterials[config.element];
  const selectedElement = typeof selection.value === "string" && selection.value in selectionMaterials
    ? selectionMaterials[selection.value as keyof typeof selectionMaterials]
    : selectionMaterials.火;
  const allElements = Object.values(selectionMaterials);
  return [
  stage("revenant-weapon-true", "天星器の真化", "recruitment-weapon", [], [
    r("material-light-upper-orb", 50),
    r("material-light-scroll", 50),
    r("material-light-gene", 50),
    r("material-white-dragon-scale", 50),
    r("material-champion-merit", 50),
    r("material-crystal", 100)
  ]),
  stage("revenant-weapon-element-change", "天星器の属性変更", "recruitment-weapon", ["revenant-weapon-true"], [
    r(config.rusted, 1),
    r(selectedElement.orb, 250),
    r(selectedElement.gene, 250),
    r("material-stellar-shard", 250),
    r(selectedElement.trueAnima, 3)
  ], "朽ち果てた武器は3凸1本です。"),
  stage("revenant-weapon-awaken-1", "天星器覚醒 第1段階", "recruitment-weapon", ["revenant-weapon-element-change"], [
    r("material-soft-feather", 300),
    r("material-primal-bit", 100),
    r("material-hard-earth", 100),
    r(selectedElement.orb, 100),
    r(selectedElement.book, 100),
    r(selectedElement.scroll, 150),
    r(selectedElement.gene, 100),
    r("material-conqueror-merit", 10),
    r("material-blue-sky-crystal", 3),
    r("material-crystal", 100)
  ], "設備拡充はアカウントで一度だけ必要な共通条件として確認します。"),
  stage("revenant-weapon-awaken-2", "天星器覚醒 第2段階", "recruitment-weapon", ["revenant-weapon-awaken-1"], [
    r("material-pure-water", 100),
    r("material-red-yellow-stone", 100),
    r("material-hollow-soul", 100),
    r(selectedElement.orb, 150),
    r(selectedElement.book, 150),
    r(selectedElement.gene, 150),
    r(selectedElement.scale, 30),
    r("material-rainbow-prism", 50),
    r(selectedElement.trueAnima, 3),
    r("material-blue-sky-crystal", 5),
    r("material-crystal", 200)
  ]),
  stage("revenant-weapon-awaken-3", "天星器覚醒 第3段階", "recruitment-weapon", ["revenant-weapon-awaken-2"], [
    r("material-wind-griffin-feather", 300),
    r("material-falcon-feather", 100),
    r("material-foresight-leaf", 80),
    r(selectedElement.orb, 200),
    r(selectedElement.upperOrb, 100),
    r(selectedElement.gene, 200),
    r(selectedElement.anima, 100),
    r("material-conqueror-merit", 10),
    r("material-blue-sky-crystal", 7),
    r("material-crystal", 300)
  ]),
  stage("revenant-weapon-awaken-4", "天星器覚醒 第4段階", "recruitment-weapon", ["revenant-weapon-awaken-3"], [
    r("material-swirl-amber", 100),
    r("material-lacrimosa", 100),
    r("material-ordine-schstein", 80),
    r(selectedElement.orb, 250),
    r(selectedElement.gene, 250),
    r(selectedElement.scale, 50),
    r("material-rainbow-prism", 150),
    r(selectedElement.trueAnima, 3),
    r("material-blue-sky-crystal", 10),
    r("material-crystal", 400)
  ]),
  stage("revenant-weapon-awaken-5", "天星器覚醒 第5段階", "recruitment-weapon", ["revenant-weapon-awaken-4"], [
    ...allElements.map((element) => r(element.magnaDrop, element === selectedElement ? 80 : 20)),
    r("material-ancient-cloth", 100),
    r("material-conqueror-merit", 10),
    r("material-blue-sky-crystal", 15),
    r("material-crystal", 500)
  ]),
  stage("revenant-weapon-awaken-6", "天星器覚醒 第6段階", "recruitment-weapon", ["revenant-weapon-awaken-5"], [
    ...allElements.map((element) => r(element.trueAnima, 3)),
    r("material-rainbow-prism", 250),
    r("material-blue-sky-crystal", 30),
    r("material-gold-brick", 1),
    r("material-crystal", 500)
  ]),
  stage("recruited", "十天衆加入", "recruitment", ["revenant-weapon-awaken-6"], [], "加入フェイトエピソードのクリアが必要です。"),
  stage("forty-box-element-change", "属性変更済み天星器10本", "final-uncap", ["recruited"], [
    r("material-light-upper-orb", 500),
    r("material-light-scroll", 500),
    r("material-light-gene", 500),
    r("material-white-dragon-scale", 500),
    r("material-champion-merit", 500),
    r("material-crystal", 1_000),
    r(config.rusted, 10),
    r(selectedElement.orb, 2_500),
    r("material-stellar-shard", 2_500),
    r(selectedElement.gene, 2_500),
    r(selectedElement.trueAnima, 30),
    r(config.revenant3, 10)
  ], "初期版は選択した1属性へ10本すべて属性変更する40箱コースを扱います。朽ち果てた武器は3凸10本です。"),
  stage("silver-relic-uncap", "銀の依代4凸", "final-uncap", ["recruited"], [
    r(config.shard, 40),
    r(config.weaponElement, 300),
    r("material-element-fire", 300),
    r("material-element-water", 300),
    r("material-element-earth", 300),
    r("material-element-wind", 300),
    r("material-element-light", 300),
    r("material-element-dark", 300)
  ], "銀の依代交換4本分の銀片を含みます。"),
  stage("gold-relic-create", "黄金の依代作成", "final-uncap", ["forty-box-element-change", "silver-relic-uncap"], [
    r("material-fire-orb", 250),
    r("material-water-orb", 250),
    r("material-earth-orb", 250),
    r("material-wind-orb", 250),
    r("material-light-orb", 250),
    r("material-dark-orb", 250),
    r("material-fire-gene", 250),
    r("material-water-gene", 250),
    r("material-earth-gene", 250),
    r("material-wind-gene", 250),
    r("material-light-gene", 250),
    r("material-dark-gene", 250),
    r("material-stellar-shard", 1_500),
    r("material-gold-brick", 1),
    r("material-silver-centrum", 10),
    r(config.starFragment, 100),
    r("material-damascus-crystal", 10),
    r("material-supreme-merit", 5),
    r(config.distinction, 30)
  ], "全属性の依代6本の作成素材を展開しています。"),
  stage("final-uncap", "最終上限解放", "final-uncap", ["gold-relic-create"], [
    r(keys.radiance, 30),
    r(keys.psyche, 10),
    r(keys.soul, 2),
    ...keys.coopBooks.map(([key, count]) => r(key, count)),
    r("material-rainbow-prism", 100)
  ], "純然たる武器の魂を使うフェイトエピソードのクリアが必要です。"),
  stage("transcendence-110", "限界超越Lv110", "transcendence", ["final-uncap"], [
    r("material-gold-brick", 1),
    r(config.shard, 200),
    r(keys.dragon, 50),
    ...keys.halos.map(([key, count]) => r(key, count)),
    r("material-damascus-crystal", 20),
    r("material-stellar-shard", 7_500),
    r(keys.orb, 7_500),
    r(keys.gene, 7_500),
    r(config.rusted, 30)
  ], "朽ち果てた武器は3凸30本（無凸120本相当）、別途100,000ルピが必要です。"),
  stage("transcendence-120", "限界超越Lv120", "transcendence", ["transcendence-110"], [
    r(keys.magna2, 50),
    r(keys.psyche, 300),
    r("material-bahamut-purple-horn", 100),
    r(config.starFragment, 50),
    r("material-supreme-merit", 100),
    r("material-blue-sky-soul", 1)
  ], "蒼天の魂交換用に20,000JP、別途5,000,000ルピが必要です。"),
  stage("transcendence-130", "限界超越Lv130", "transcendence", ["transcendence-120"], [
    r("material-azure-accolade", 1)
  ], "別途5,000,000ルピが必要です。"),
  stage("transcendence-140", "限界超越Lv140", "transcendence", ["transcendence-130"], [
    r(config.magna140, 30),
    ...config.brights.map(([key, count]) => r(key, count)),
    r(config.weaponElement, 2_000),
    r(keys.element, 2_000),
    r(keys.dragonJewel, 300),
    r("material-true-dragon-golden-scale", 50)
  ], "別途5,000,000ルピが必要です。"),
  stage("transcendence-150", "限界超越Lv150", "transcendence", ["transcendence-140"], [
    ...(expandExchangeMaterials ? [
      r("material-dark-residue", 30),
      r("material-black-wings", 30),
      r("material-cunning-horn", 30),
      r("material-azure-accolade", 1)
    ] : [
      r("material-heroic-spirits-pride", 1)
    ])
  ], expandExchangeMaterials
    ? "雄偉者たちの矜持の交換素材を展開しています。別途5,000,000ルピが必要です。"
    : "別途5,000,000ルピが必要です。雄偉者たちの矜持は高難度素材と碧麗の証から交換できます。")
  ];
}

function eternalPreset(version: number, expandExchangeMaterials: boolean, isAvailable: boolean): ProgressPreset {
  return {
    id: "eternals",
    version,
    name: "十天衆",
    targetLabel: "十天衆",
    selectionLabel: "天星器の属性変更先",
    selectionOptions: ["火", "水", "土", "風", "光", "闇"],
    targets: eternalConfigs.map(({ id, name }) => ({ id, name })),
    groups: [
      { id: "recruitment-weapon", name: "加入用天星器", sortOrder: 1 },
      { id: "recruitment", name: "十天衆加入", sortOrder: 2 },
      { id: "final-uncap", name: "最終上限解放（40箱コース）", sortOrder: 3 },
      { id: "transcendence", name: "限界超越", sortOrder: 4 }
    ],
    stages: stagesFor(eternalConfigs[0]).map((stage) => ({ ...stage, requirements: [] })),
    resolveStages: (targetId, selection) => {
      const config = eternalConfigs.find((item) => item.id === targetId);
      return config ? stagesFor(config, selection, expandExchangeMaterials) : [];
    },
    isAvailable
  };
}

export const eternalProgressPresetVersion2 = eternalPreset(2, false, false);

export const eternalProgressPreset = eternalPreset(3, true, true);
