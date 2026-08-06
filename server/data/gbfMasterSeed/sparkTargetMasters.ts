import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

type MasterEnrichment = Pick<GbfMasterSeedItem, "category" | "tags" | "metadata" | "isActive">;

const zodiacPairs = [
  ["char-anila", "weapon-zodiac-anila"],
  ["char-andira", "weapon-zodiac-andira"],
  ["char-mahira", "weapon-zodiac-mahira"],
  ["char-vajra", "weapon-zodiac-vajra"],
  ["char-kumbhira", "weapon-zodiac-kumbhira"],
  ["char-vikala", "weapon-zodiac-vikala"],
  ["char-catura", "weapon-zodiac-catura"],
  ["char-cidala", "weapon-zodiac-cidala"],
  ["char-makura", "weapon-zodiac-makura"],
  ["char-payila", "weapon-zodiac-payila"],
  ["char-indala", "weapon-zodiac-indala"],
  ["char-sandira", "weapon-zodiac-sandira"],
] as const;

const summonSeriesById: Record<string, string> = {
  "summon-agni": "optimus",
  "summon-varuna": "optimus",
  "summon-titan": "optimus",
  "summon-zephyrus": "optimus",
  "summon-zeus": "optimus",
  "summon-hades": "optimus",
  "summon-michael": "archangel",
  "summon-gabriel": "archangel",
  "summon-uriel": "archangel",
  "summon-raphael": "archangel",
  "summon-metatron": "archangel",
  "summon-sariel": "archangel",
  "summon-halluel-malluel": "archangel",
  "summon-wilnas": "six-dragons",
  "summon-wamdus": "six-dragons",
  "summon-galleon": "six-dragons",
  "summon-ewiyar": "six-dragons",
  "summon-lu-woh": "six-dragons",
  "summon-fediel": "six-dragons",
  "summon-lucifer": "providence",
  "summon-bahamut": "providence",
  "summon-yatima": "providence",
  "summon-triple-zero": "providence",
  "summon-versusia": "providence",
  "summon-belial": "providence",
  "summon-bubz": "providence",
  "summon-orologia": "providence",
  "summon-shiva": "genesis",
  "summon-europa": "genesis",
  "summon-godguard-brodia": "genesis",
  "summon-grimnir": "genesis",
};

const enrichmentById = new Map<string, MasterEnrichment>();

for (const [characterId, unlockWeaponId] of zodiacPairs) {
  enrichmentById.set(characterId, {
    category: "十二神将",
    tags: ["限定", "十二神将", "レジェンドフェス"],
    metadata: { acquisitionGroup: "zodiac", unlockWeaponId, availabilityPolicy: "annual-rotation" },
  });
}

for (const [id, series] of Object.entries(summonSeriesById)) {
  enrichmentById.set(id, {
    category: series,
    metadata: { acquisitionGroup: "gacha-summon-series", series },
  });
}


export function applySparkTargetMasterEnrichment(items: GbfMasterSeedItem[]) {
  return items.map((item) => {
    const enrichment = enrichmentById.get(item.id);
    if (!enrichment) return item;
    return {
      ...item,
      ...enrichment,
      tags: [...new Set([...(item.tags ?? []), ...(enrichment.tags ?? [])])],
      metadata: { ...(item.metadata ?? {}), ...(enrichment.metadata ?? {}) },
    };
  });
}

const zodiacWeapons: GbfMasterSeedItem[] = [
  ["weapon-zodiac-anila", "天干地支刀・未之飾", "火", "char-anila"],
  ["weapon-zodiac-andira", "天干地支刀・申之飾", "風", "char-andira"],
  ["weapon-zodiac-mahira", "天干地支弓・酉之飾", "土", "char-mahira"],
  ["weapon-zodiac-vajra", "天干地支爪・戌之飾", "水", "char-vajra"],
  ["weapon-zodiac-kumbhira", "天干地支鉾・亥之飾", "光", "char-kumbhira"],
  ["weapon-zodiac-vikala", "天干地支筒・子之飾", "闇", "char-vikala"],
  ["weapon-zodiac-catura", "天干地支像・丑之飾", "風", "char-catura"],
  ["weapon-zodiac-cidala", "天干地支爪・寅之飾", "土", "char-cidala"],
  ["weapon-zodiac-makura", "天干地支刀・卯之飾", "光", "char-makura"],
  ["weapon-zodiac-payila", "天干地支扇・辰之飾", "水", "char-payila"],
  ["weapon-zodiac-indala", "天干地支剣・巳之飾", "闇", "char-indala"],
  ["weapon-zodiac-sandira", "天干地支弓・午之飾", "火", "char-sandira"],
].map(([id, name, element, unlockCharacterId]) => ({
  id,
  kind: GbfMasterKind.weapon,
  name,
  element,
  rarity: "SSR",
  category: "十二神将解放武器",
  tags: ["限定", "十二神将", "レジェンドフェス"],
  metadata: { acquisitionGroup: "zodiac", unlockCharacterId, availabilityPolicy: "annual-rotation" },
}));

const missingSeriesSummons: GbfMasterSeedItem[] = [
  {
    id: "summon-halluel-malluel",
    kind: GbfMasterKind.summon,
    name: "ハールート・マールート",
    element: "光",
    rarity: "SSR",
    aliases: ["ハルマル", "ハールートマールート"],
    tags: ["天司", "サブ加護", "光"],
  },
  {
    id: "summon-versusia",
    kind: GbfMasterKind.summon,
    name: "ヴェルサシア",
    element: "無属性",
    rarity: "SSR",
    aliases: ["Versusia"],
    tags: ["プロヴィデンス"],
  },
  {
    id: "summon-orologia",
    kind: GbfMasterKind.summon,
    name: "オロロジャイア",
    element: "無属性",
    rarity: "SSR",
    aliases: ["Orologia", "ロジャー"],
    tags: ["プロヴィデンス"],
  },
];

const missingGrandWeapons: GbfMasterSeedItem[] = [
  ["char-mikaboshi-grand", "ネビュラ・ガントレット", "火"],
  ["char-octavia", "絡繰刀・雲隠", "水"],
  ["char-walfrid", "オーダーブリンガー", "風"],
  ["char-caesar", "白耀剣", "光"],
  ["char-baishura-grand", "医王善杖", "土"],
  ["char-sylvia", "断罪の黎刃", "水"],
  ["char-sariel", "エクスキューショナー", "闇"],
  ["char-siegfried-grand", "ヘルデンヒュムネ", "土"],
  ["char-basara", "天干地支刀・戌之威", "光"],
  ["char-yuel-grand", "千年護持", "火"],
  ["char-raphael", "天風の鋭輪", "風"],
  ["char-yatima", "ルベウス・スティーリア", "水"],
  ["char-vane-grand", "スワン", "風"],
  ["char-orologia", "因果の楔針", "闇"],
  ["char-sandalphon-light-grand", "エフェス", "光"],
  ["char-uriel", "パイルスマッシュ", "土"],
  ["char-gabriel", "水天の福音", "水"],
  ["char-kaguya", "迦具夜之扇子", "風"],
  ["char-cosmos", "ディアテシア", "光"],
  ["char-ewiyar", "劫風の翼鋭", "風"],
  ["char-lu-woh", "威光の逆鱗", "光"],
  ["char-halluel-and-malluel", "永遠の落款", "闇"],
  ["char-charlotta-grand", "輝剣クラウ・ソラス・ディオン", "風"],
  ["char-wamdus", "水禍の麗傘", "水"],
  ["char-wilnas", "炎威の翼鎌", "火"],
  ["char-cagliostro-grand", "ウロボロス・オリジン", "光"],
  ["char-leona-grand", "八幡薙刀", "土"],
  ["char-reinhardtzar-grand", "絶拳", "火"],
  ["char-rei", "シューニャ", "闇"],
  ["char-zooey-grand", "リボン", "闇"],
].map(([unlockCharacterId, name, element]) => ({
  id: `weapon-grand-${unlockCharacterId.replace(/^char-/, "")}`,
  kind: GbfMasterKind.weapon,
  name,
  element,
  rarity: "SSR",
  category: "リミテッド解放武器",
  tags: ["限定", "リミテッド"],
  metadata: { acquisitionGroup: "limited", unlockCharacterId },
}));

const grandPairs = [
  ["char-mikaboshi-grand", "weapon-grand-mikaboshi-grand"], ["char-octavia", "weapon-grand-octavia"],
  ["char-walfrid", "weapon-grand-walfrid"], ["char-caesar", "weapon-grand-caesar"],
  ["char-baishura-grand", "weapon-grand-baishura-grand"], ["char-metera-grand", "weapon-grand-aetherial-maverick"],
  ["char-sylvia", "weapon-grand-sylvia"], ["char-sariel", "weapon-grand-sariel"],
  ["char-siegfried-grand", "weapon-grand-siegfried-grand"], ["char-basara", "weapon-grand-basara"],
  ["char-yuel-grand", "weapon-grand-yuel-grand"], ["char-raphael", "weapon-grand-raphael"],
  ["char-yatima", "weapon-grand-yatima"], ["char-vane-grand", "weapon-grand-vane-grand"],
  ["char-medusa-grand", "weapon-grand-bloodwrought-coral"], ["char-orologia", "weapon-grand-orologia"],
  ["char-fenie", "weapon-grand-phoenix-torch"], ["char-sandalphon-light-grand", "weapon-grand-sandalphon-light-grand"],
  ["char-uriel", "weapon-grand-uriel"], ["char-zeta-grand", "weapon-grand-overrider"],
  ["char-gabriel", "weapon-grand-gabriel"], ["char-kaguya", "weapon-grand-kaguya"],
  ["char-cosmos", "weapon-grand-cosmos"], ["char-ewiyar", "weapon-grand-ewiyar"],
  ["char-lu-woh", "weapon-grand-lu-woh"], ["char-halluel-and-malluel", "weapon-grand-halluel-and-malluel"],
  ["char-michael", "weapon-grand-crimson-scale"], ["char-charlotta-grand", "weapon-grand-charlotta-grand"],
  ["char-percival", "weapon-grand-lord-of-flames"], ["char-wamdus", "weapon-grand-wamdus"],
  ["char-galleon", "weapon-grand-landslide-scepter"], ["char-yuni", "weapon-grand-harmonia"],
  ["char-wilnas", "weapon-grand-wilnas"], ["char-fediel", "weapon-grand-fediel-spine"],
  ["char-lancelot-grand", "weapon-grand-knight-of-ice"], ["char-lich", "weapon-grand-pain-and-suffering"],
  ["char-poseidon", "weapon-grand-atlantis"], ["char-nehan", "weapon-grand-radiant-rinne"],
  ["char-narmaya-grand", "weapon-grand-evanescence"], ["char-cagliostro-grand", "weapon-grand-cagliostro-grand"],
  ["char-sandalphon-grand", "weapon-grand-world-ender"], ["char-golden-knight", "weapon-grand-cerastes"],
  ["char-leona-grand", "weapon-grand-leona-grand"], ["char-reinhardtzar-grand", "weapon-grand-reinhardtzar-grand"],
  ["char-mugen", "weapon-grand-kerak"], ["char-rei", "weapon-grand-rei"],
  ["char-noa-grand", "weapon-grand-ivory-ark"], ["char-shalem", "weapon-grand-bab-el-mandeb"],
  ["char-jeanne-grand", "weapon-grand-sacred-standard"], ["char-monika-grand", "weapon-grand-sky-ace"],
  ["char-grimnir", "weapon-grand-vortex-of-the-void"], ["char-ferry-grand", "weapon-grand-unheil"],
  ["char-shiva", "weapon-grand-purifying-thunderbolt"], ["char-europa", "weapon-grand-galileis-insight"],
  ["char-pholia", "weapon-grand-taisai-spirit-bow"], ["char-cain-grand", "weapon-grand-ichigo-hitofuri"],
  ["char-alexiel-grand", "weapon-grand-mirror-blade-shard"], ["char-olivia-grand", "weapon-grand-fallen-sword"],
  ["char-vira-grand", "weapon-grand-certificus"], ["char-drang-grand", "weapon-grand-blue-sphere"],
  ["char-sturm-grand", "weapon-grand-ixaba"], ["char-orchid-grand", "weapon-grand-parazonium"],
  ["char-lucio", "weapon-grand-eden"], ["char-lecia-grand", "weapon-grand-reunion"],
  ["char-zooey-grand", "weapon-grand-zooey-grand"], ["char-black-knight", "weapon-grand-blutgang"],
  ["char-eugen-grand", "weapon-grand-ak-4a"], ["char-rosetta-grand", "weapon-grand-love-eternal"],
  ["char-io-grand", "weapon-grand-gambanteinn"], ["char-rackam-grand", "weapon-grand-benedia"],
  ["char-katalina-grand", "weapon-grand-murgleis"],
] as const;

for (const [characterId, weaponId] of grandPairs) {
  const current = enrichmentById.get(characterId) ?? {};
  enrichmentById.set(characterId, {
    ...current,
    category: "リミテッド",
    tags: [...new Set([...(current.tags ?? []), "限定", "リミテッド"])],
    metadata: { ...(current.metadata ?? {}), acquisitionGroup: "limited", unlockWeaponId: weaponId },
  });
  const weaponCurrent = enrichmentById.get(weaponId) ?? {};
  enrichmentById.set(weaponId, {
    ...weaponCurrent,
    category: "リミテッド解放武器",
    tags: [...new Set([...(weaponCurrent.tags ?? []), "限定", "リミテッド"])],
    metadata: { ...(weaponCurrent.metadata ?? {}), acquisitionGroup: "limited", unlockCharacterId: characterId },
  });
}

export const sparkTargetMasterSeeds = [...zodiacWeapons, ...missingSeriesSummons, ...missingGrandWeapons];
