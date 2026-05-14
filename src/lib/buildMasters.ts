export type BuildMasterKind = "character" | "summon" | "weapon" | "job";

export type BuildMasterItem = {
  id: string;
  kind: BuildMasterKind;
  name: string;
  element?: string;
  rarity?: string;
  weaponType?: string;
  series?: string;
  tags?: string[];
  thumbnailUrl?: string;
  note?: string;
};

const thumbnailBase = "/assets/build-thumbnails";

export const buildMasterItems: BuildMasterItem[] = [
  { id: "job-kengo", kind: "job", name: "剣豪", tags: ["奥義", "高難度"] },
  { id: "job-yamato", kind: "job", name: "ヤマト", tags: ["予兆対応", "高難度"] },
  { id: "job-manadiver", kind: "job", name: "マナダイバー", tags: ["フルオート", "周回"] },
  { id: "job-berserker", kind: "job", name: "ベルセルク", tags: ["火力", "周回"] },
  { id: "job-paladin", kind: "job", name: "パラディン", tags: ["耐久", "高難度"] },
  { id: "job-robinhood", kind: "job", name: "ロビンフッド", tags: ["弱体", "高難度"] },
  { id: "job-chaos-ruler", kind: "job", name: "カオスルーダー", tags: ["弱体"] },
  { id: "job-relic-buster", kind: "job", name: "レリックバスター", tags: ["周回"] },
  { id: "job-wrestler", kind: "job", name: "レスラー", tags: ["短期", "周回"] },

  { id: "char-haaselia", kind: "character", name: "ハーゼリーラ", element: "水", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["十賢者", "高難度"] },
  { id: "char-gabriel", kind: "character", name: "ガブリエル", element: "水", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["リミテッド", "高難度"] },
  { id: "char-wamdus", kind: "character", name: "ワムデュス", element: "水", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["リミテッド", "耐久"] },
  { id: "char-satyr", kind: "character", name: "サテュロス", element: "土", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["耐久"] },
  { id: "char-okto", kind: "character", name: "オクトー", element: "土", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["十天衆", "奥義"] },
  { id: "char-caim", kind: "character", name: "カイム", element: "土", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["十賢者", "サブ"] },
  { id: "char-percival", kind: "character", name: "パーシヴァル", element: "火", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["リミテッド", "周回"] },
  { id: "char-michael", kind: "character", name: "ミカエル", element: "火", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["リミテッド", "周回"] },
  { id: "char-wilnas", kind: "character", name: "ウィルナス", element: "火", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/character.svg`, tags: ["リミテッド", "火力"] },

  { id: "summon-varuna", kind: "summon", name: "ヴァルナ", element: "水", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["神石", "メイン"] },
  { id: "summon-titan", kind: "summon", name: "ティターン", element: "土", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["神石", "メイン"] },
  { id: "summon-agni", kind: "summon", name: "アグニス", element: "火", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["神石", "メイン"] },
  { id: "summon-bubz", kind: "summon", name: "ベルゼバブ", element: "無属性", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["高難度", "周回"] },
  { id: "summon-yatima", kind: "summon", name: "ヤチマ", element: "無属性", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["高難度"] },
  { id: "summon-lucifer", kind: "summon", name: "ルシフェル", element: "光", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["回復", "耐久"] },
  { id: "summon-godguard-brodia", kind: "summon", name: "ゴッドガード・ブローディア", element: "土", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["防御"] },
  { id: "summon-sun", kind: "summon", name: "サン", element: "火", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/summon.svg`, tags: ["アーカルム", "周回"] },

  { id: "weapon-ultima-katana", kind: "weapon", name: "オメガ刀", element: "無属性", rarity: "SSR", weaponType: "刀", series: "オメガ", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["高難度"] },
  { id: "weapon-ultima", kind: "weapon", name: "オメガ武器", element: "無属性", rarity: "SSR", series: "オメガ", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["高難度"] },
  { id: "weapon-dark-opus", kind: "weapon", name: "終末武器", element: "可変", rarity: "SSR", series: "終末", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["必須級"] },
  { id: "weapon-water-ougi", kind: "weapon", name: "水属性の奥義寄せ武器", element: "水", rarity: "SSR", series: "奥義", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["奥義"] },
  { id: "weapon-fire-limited", kind: "weapon", name: "火リミ武器", element: "火", rarity: "SSR", series: "リミテッド", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["周回"] },
  { id: "weapon-kyokusei", kind: "weapon", name: "極星器", element: "無属性", rarity: "SSR", series: "極星器", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["周回"] },
  { id: "weapon-hp-flex", kind: "weapon", name: "HPを確保できる武器", element: "可変", rarity: "SSR", thumbnailUrl: `${thumbnailBase}/weapon.svg`, tags: ["耐久"] }
];

export const buildMasterOptions = {
  characters: buildMasterItems.filter((item) => item.kind === "character"),
  summons: buildMasterItems.filter((item) => item.kind === "summon"),
  weapons: buildMasterItems.filter((item) => item.kind === "weapon"),
  jobs: buildMasterItems.filter((item) => item.kind === "job")
};

export function findBuildMaster(kind: BuildMasterKind, name: string) {
  const normalized = name.trim();
  return buildMasterItems.find((item) => item.kind === kind && item.name === normalized);
}
