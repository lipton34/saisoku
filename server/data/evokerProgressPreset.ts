import { progressMaterialNames, type ProgressMaterialKey } from "./progressMaterials.js";
import type { ProgressPreset, ProgressRequirement, ProgressStage } from "./progressPresets.js";

type Element = "fire" | "water" | "earth" | "wind" | "light" | "dark";
type Area = "aquila" | "bellator" | "celsus";
type Arcana = "sun" | "devil" | "justice" | "moon" | "hanged-man" | "tower" | "temperance" | "judgement" | "star" | "death";

type EvokerConfig = {
  id: string;
  name: string;
  element: Element;
  arcana: Arcana;
  area: Area;
  summonName: string;
  weaponName: string;
  showdown: ProgressMaterialKey;
  island: ProgressMaterialKey;
};

const evokers: EvokerConfig[] = [
  { id: "aranan", name: "アラナン", element: "fire", arcana: "sun", area: "aquila", summonName: "ザ・サン", weaponName: "ヒート・オブ・ザ・サン", showdown: "material-scorched-hellfire-horn", island: "material-ascetic-memorandum" },
  { id: "fraux", name: "フラウ", element: "fire", arcana: "devil", area: "aquila", summonName: "ザ・デビル", weaponName: "キス・オブ・ザ・デビル", showdown: "material-scorched-hellfire-horn", island: "material-rem-pepper" },
  { id: "maria-theresa", name: "マリア・テレサ", element: "water", arcana: "justice", area: "bellator", summonName: "ジャスティス", weaponName: "ライズ・オブ・ジャスティス", showdown: "material-frozen-hell-prism", island: "material-toxic-flower" },
  { id: "haaselia", name: "ハーゼリーラ", element: "water", arcana: "moon", area: "bellator", summonName: "ザ・ムーン", weaponName: "リフレクト・オブ・ザ・ムーン", showdown: "material-frozen-hell-prism", island: "material-translucent-silk" },
  { id: "caim", name: "カイム", element: "earth", arcana: "hanged-man", area: "aquila", summonName: "ザ・ハングドマン", weaponName: "タイ・オブ・ザ・ハングドマン", showdown: "material-judgement-crystal", island: "material-bestie-fruit" },
  { id: "lobelia", name: "ロベリア", element: "earth", arcana: "tower", area: "celsus", summonName: "ザ・タワー", weaponName: "クラッシュ・オブ・ザ・タワー", showdown: "material-judgement-crystal", island: "material-broken-teacup" },
  { id: "estariola", name: "エスタリオラ", element: "wind", arcana: "temperance", area: "celsus", summonName: "テンペランス", weaponName: "プレイ・オブ・ザ・テンペランス", showdown: "material-centaur-disk", island: "material-kluger-herb" },
  { id: "katzelia", name: "カッツェリーラ", element: "wind", arcana: "judgement", area: "bellator", summonName: "ジャッジメント", weaponName: "メロディ・オブ・ジャッジメント", showdown: "material-centaur-disk", island: "material-dusty-book" },
  { id: "geisenborger", name: "ガイゼンボーガ", element: "light", arcana: "star", area: "celsus", summonName: "ザ・スター", weaponName: "ショット・オブ・ザ・スター", showdown: "material-princess-light-crystal", island: "material-rusted-roof-tile" },
  { id: "nier", name: "ニーア", element: "dark", arcana: "death", area: "celsus", summonName: "デス", weaponName: "ペイン・オブ・デス", showdown: "material-phantom-demon-fragment", island: "material-giant-beast-bone" }
];

const elementKeys = {
  fire: { astra: "material-astra-fire", haze: "material-aurora-haze", element: "material-element-fire", psyche: "material-psyche-fire", magna: "material-colossus-magna-anima", magna2: "material-shiva-magna-anima", oldAnima: "material-flam-glass-anima", newAnima: "material-athena-anima", bright: "material-ignis-bright", dragonJewel: "material-wilnas-jewel", dragon: "material-ignite-rubble", stone: "material-stone-fragment-fire" },
  water: { astra: "material-astra-water", haze: "material-chaotic-haze", element: "material-element-water", psyche: "material-psyche-water", magna: "material-leviathan-magna-anima", magna2: "material-europa-magna-anima", oldAnima: "material-macula-marius-anima", newAnima: "material-grani-anima", bright: "material-aqua-bright", dragonJewel: "material-wamdus-jewel", dragon: "material-abyssal-tragedy", stone: "material-stone-fragment-water" },
  earth: { astra: "material-astra-earth", haze: "material-chaotic-haze", element: "material-element-earth", psyche: "material-psyche-earth", magna: "material-yggdrasil-magna-anima", magna2: "material-brodia-magna-anima", oldAnima: "material-medusa-anima", newAnima: "material-baal-anima", bright: "material-terra-bright", dragonJewel: "material-galleon-jewel", dragon: "material-insular-core", stone: "material-stone-fragment-earth" },
  wind: { astra: "material-astra-wind", haze: "material-aurora-haze", element: "material-element-wind", psyche: "material-psyche-wind", magna: "material-tiamat-magna-anima", magna2: "material-grimnir-magna-anima", oldAnima: "material-nataku-anima", newAnima: "material-garuda-anima", bright: "material-ventosus-bright", dragonJewel: "material-ewiyar-jewel", dragon: "material-gale-rock", stone: "material-stone-fragment-wind" },
  light: { astra: "material-astra-light", haze: "material-aurora-haze", element: "material-element-light", psyche: "material-psyche-light", magna: "material-luminiera-magna-anima", magna2: "material-metatron-magna-anima", oldAnima: "material-apollo-anima", newAnima: "material-odin-anima", bright: "material-ignis-bright", dragonJewel: "material-lu-woh-jewel", dragon: "material-thunder-wheel", stone: "material-stone-fragment-fire" },
  dark: { astra: "material-astra-dark", haze: "material-chaotic-haze", element: "material-element-dark", psyche: "material-psyche-dark", magna: "material-celeste-magna-anima", magna2: "material-avatar-magna-anima", oldAnima: "material-olivia-anima", newAnima: "material-lich-anima", bright: "material-aqua-bright", dragonJewel: "material-fediel-jewel", dragon: "material-todestrieb", stone: "material-stone-fragment-water" }
} as const satisfies Record<Element, Record<string, ProgressMaterialKey>>;

const areaKeys = {
  aquila: "material-aquila-fragment",
  bellator: "material-bellator-fragment",
  celsus: "material-celsus-fragment"
} as const satisfies Record<Area, ProgressMaterialKey>;

function r(itemKey: ProgressMaterialKey, requiredCount: number): ProgressRequirement {
  return { itemKey, itemName: progressMaterialNames[itemKey], requiredCount };
}

function reqs(...values: Array<ProgressRequirement | ProgressRequirement[]>) {
  return values.flat();
}

function splitKeys(config: EvokerConfig, normalKey: ProgressMaterialKey, lightKeys: [ProgressMaterialKey, ProgressMaterialKey], darkKeys: [ProgressMaterialKey, ProgressMaterialKey]) {
  return config.element === "light" ? lightKeys : config.element === "dark" ? darkKeys : [normalKey];
}

function splitEqual(keys: ProgressMaterialKey[], total: number) {
  return keys.map((key) => r(key, total / keys.length));
}

function verum(config: EvokerConfig, count: number) {
  const normal = `material-verum-proof-${config.element}` as ProgressMaterialKey;
  return splitEqual(splitKeys(config, normal, ["material-verum-proof-fire", "material-verum-proof-wind"], ["material-verum-proof-water", "material-verum-proof-earth"]), count);
}

function bright(config: EvokerConfig, normalCount: number, specialEach?: number) {
  const keys = splitKeys(config, elementKeys[config.element].bright, ["material-ignis-bright", "material-ventosus-bright"], ["material-aqua-bright", "material-terra-bright"]);
  return keys.length === 1 ? [r(keys[0], normalCount)] : keys.map((key) => r(key, specialEach ?? normalCount / 2));
}

function angel(config: EvokerConfig) {
  if (config.element === "light") return [r("material-michael-anima", 10), r("material-raphael-anima", 10)];
  if (config.element === "dark") return [r("material-gabriel-anima", 10), r("material-uriel-anima", 10)];
  const key = { fire: "material-michael-anima", water: "material-gabriel-anima", earth: "material-uriel-anima", wind: "material-raphael-anima" }[config.element] as ProgressMaterialKey;
  return [r(key, 20)];
}

function stones(config: EvokerConfig) {
  if (config.element === "light") return [r("material-stone-fragment-fire", 25), r("material-stone-fragment-wind", 25)];
  if (config.element === "dark") return [r("material-stone-fragment-water", 25), r("material-stone-fragment-earth", 25)];
  return [r(elementKeys[config.element].stone, 50)];
}

function gospel(config: EvokerConfig) {
  if (config.element === "light") return [r("material-egeira-gospel", 25), r("material-genea-gospel", 25)];
  if (config.element === "dark") return [r("material-analepsia-gospel", 25), r("material-thysia-gospel", 25)];
  const key = { fire: "material-egeira-gospel", water: "material-analepsia-gospel", earth: "material-thysia-gospel", wind: "material-genea-gospel" }[config.element] as ProgressMaterialKey;
  return [r(key, 50)];
}

function stage(id: string, name: string, groupId: string, dependsOn: string[], requirements: ProgressRequirement[], note?: string): ProgressStage {
  return { id, name, groupId, kind: "stage", dependsOn, requirements, conditions: [], note };
}

function stagesFor(config: EvokerConfig): ProgressStage[] {
  const keys = elementKeys[config.element];
  const idea = `material-${config.arcana}-idea` as ProgressMaterialKey;
  const veritas = `material-${config.arcana}-veritas` as ProgressMaterialKey;
  const fragment = areaKeys[config.area];
  return [
    stage("arcarum-summon-obtain", "SR召喚石交換", "arcarum-summon", [], reqs(r("material-sephira-stone", 2), r(keys.astra, 3), r(idea, 2), verum(config, 6), r(keys.haze, 1), r("material-flawless-prism", 100), r(keys.magna, 30))),
    stage("arcarum-summon-sr-uncap-1", "SR1凸", "arcarum-summon", ["arcarum-summon-obtain"], reqs(r("material-sephira-stone", 5), r(keys.astra, 5), r(idea, 3), verum(config, 16), r(keys.haze, 3), r("material-rainbow-prism", 100), r(keys.element, 100))),
    stage("arcarum-summon-sr-uncap-2", "SR2凸", "arcarum-summon", ["arcarum-summon-sr-uncap-1"], reqs(r("material-sephira-stone", 10), r(keys.astra, 10), r(idea, 5), verum(config, 30), r(keys.haze, 7), r(keys.oldAnima, 30))),
    stage("arcarum-summon-sr-uncap-3", "SR3凸", "arcarum-summon", ["arcarum-summon-sr-uncap-2"], reqs(r("material-sephira-stone", 15), r(keys.astra, 15), r(idea, 7), verum(config, 50), r(keys.haze, 16), r(keys.newAnima, 30), r("material-supreme-merit", 3))),
    stage("arcarum-summon-ssr", "SSR化", "arcarum-summon", ["arcarum-summon-sr-uncap-3"], reqs(r("material-sephira-stone", 30), r(keys.astra, 30), r(idea, 15), verum(config, 80), r(keys.haze, 24), r("material-silver-centrum", 5), angel(config), r("material-sunlight-stone", 1))),
    stage("arcarum-summon-ssr-uncap-4", "SSR4凸", "arcarum-summon", ["arcarum-summon-ssr"], reqs(r("material-sephira-stone", 45), r(keys.astra, 45), r(idea, 25), verum(config, 120), r(keys.haze, 32), r(keys.magna2, 10), r(fragment, 10))),
    stage("arcarum-summon-ssr-uncap-5", "SSR5凸", "arcarum-summon", ["arcarum-summon-ssr-uncap-4"], reqs(r(config.showdown, 100), stones(config), verum(config, 250), r("material-genesis-fragment", 80), r("material-bahamut-purple-horn", 10), r(fragment, 20), r(config.island, 50))),
    stage("recruited", "十賢者加入", "recruitment", ["arcarum-summon-ssr-uncap-5"], reqs(r(idea, 20), r(keys.astra, 200), r("material-sephira-stone", 30), r("material-sephira-jade", 1)), "専用カード交換素材を含みます。"),
    stage("foundation-weapon-obtain", "礎武器交換", "foundation-weapon", ["recruited"], reqs(r("material-new-world-quartz", 5), bright(config, 5, 3), r(veritas, 20))),
    stage("foundation-weapon-uncap-1", "礎武器1凸", "foundation-weapon", ["foundation-weapon-obtain"], reqs(r("material-new-world-quartz", 5), bright(config, 15, 7), r(veritas, 70), r("material-malice-fragment", 30), verum(config, 100), r(keys.astra, 30))),
    stage("foundation-weapon-uncap-2", "礎武器2凸", "foundation-weapon", ["foundation-weapon-uncap-1"], reqs(r("material-new-world-quartz", 10), bright(config, 30, 15), r(veritas, 100), r("material-verdant-azurite", 20), verum(config, 150), r(keys.astra, 50), r(idea, 30))),
    stage("foundation-weapon-uncap-3", "礎武器3凸", "foundation-weapon", ["foundation-weapon-uncap-2"], reqs(r("material-new-world-quartz", 20), bright(config, 50, 25), r(veritas, 130), r(keys.dragonJewel, 20), verum(config, 200), r(keys.astra, 100), r(idea, 70))),
    stage("foundation-weapon-uncap-4", "礎武器4凸", "foundation-weapon", ["foundation-weapon-uncap-3"], reqs(r("material-new-world-quartz", 20), bright(config, 60, 30), r(veritas, 150), r(keys.dragonJewel, 30), verum(config, 250), r(keys.astra, 120), r(idea, 100))),
    stage("foundation-weapon-uncap-5", "礎武器5凸", "foundation-weapon", ["foundation-weapon-uncap-4"], reqs(r("material-new-world-quartz", 30), bright(config, 70, 35), r(veritas, 170), r(keys.dragon, 30), r(fragment, 30), r(keys.astra, 140), r(idea, 130), r("material-eternity-sand", 3))),
    stage("domain-release-1", "第1解放", "domain", ["foundation-weapon-obtain"], reqs(r("material-genesis-fragment", 30), verum(config, 120), r(keys.haze, 20), r("material-sephira-stone", 5))),
    stage("domain-release-2", "第2解放", "domain", ["domain-release-1", "foundation-weapon-uncap-1"], reqs(r(keys.psyche, 30), verum(config, 240), r(keys.astra, 30), r(keys.haze, 30), r("material-sephira-stone", 10))),
    stage("domain-release-3", "第3解放", "domain", ["domain-release-2", "foundation-weapon-uncap-2"], reqs(r(keys.magna2, 10), r(veritas, 30), r(keys.astra, 40), r(idea, 40), r(fragment, 10), r("material-sephira-stone", 15))),
    stage("domain-release-4", "第4解放", "domain", ["domain-release-3", "foundation-weapon-uncap-3"], reqs(r(keys.dragon, 30), bright(config, 20, 10), r(veritas, 50), r(keys.astra, 40), r(idea, 70), r(fragment, 20), r("material-sephira-stone", 20))),
    { id: "domain-complete", name: "全解放", groupId: "domain", kind: "milestone", dependsOn: ["domain-release-4"], requirements: [], conditions: [] },
    stage("final-uncap", "最終上限解放", "final-uncap-process", ["foundation-weapon-uncap-5", "domain-complete"], reqs(r("material-sephira-jade", 1), gospel(config), bright(config, 50, 25), r("material-sephira-stone", 200)), "討伐・フェイトエピソードは参考条件として確認してください。"),
    stage("fourth-ability", "4アビ取得", "fourth-ability-process", ["final-uncap"], reqs(r("material-sunlight-stone", 1), r("material-world-idea", 100), r("material-new-world-quartz", 30), r("material-damascus-crystal", 10)), "Lv100・ザ・ワールド関連条件・フェイトエピソードは参考条件として確認してください。")
  ];
}

export const evokerProgressPreset: ProgressPreset = {
  id: "evokers",
  version: 2,
  name: "十賢者",
  targetLabel: "十賢者",
  targets: evokers.map(({ id, name }) => ({ id, name })),
  groups: [
    { id: "arcarum-summon", name: "アーカルム召喚石", sortOrder: 1 },
    { id: "recruitment", name: "十賢者加入", sortOrder: 2 },
    { id: "foundation-weapon", name: "新世界の礎", sortOrder: 3 },
    { id: "domain", name: "至賢の領域", sortOrder: 4 },
    { id: "final-uncap-process", name: "最終上限解放", sortOrder: 5 },
    { id: "fourth-ability-process", name: "4アビ取得", sortOrder: 6 }
  ],
  stages: stagesFor(evokers[0]).map((stage) => ({ ...stage, requirements: [] })),
  resolveStages: (targetId) => {
    const config = evokers.find((item) => item.id === targetId);
    if (!config) throw new Error(`十賢者の対象IDが不正です: ${targetId}`);
    return stagesFor(config);
  },
  isAvailable: true
};
