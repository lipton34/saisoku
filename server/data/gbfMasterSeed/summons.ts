import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

export const summonMasterSeeds: GbfMasterSeedItem[] = [
  {
    id: "summon-varuna",
    kind: GbfMasterKind.summon,
    name: "ヴァルナ",
    element: "水",
    rarity: "SSR",
    thumbnailPath: "summons/varuna.webp",
    tags: ["神石", "メイン"]
  },
  {
    id: "summon-titan",
    kind: GbfMasterKind.summon,
    name: "ティターン",
    element: "土",
    rarity: "SSR",
    thumbnailPath: "summons/titan.webp",
    tags: ["神石", "メイン"]
  },
  {
    id: "summon-agni",
    kind: GbfMasterKind.summon,
    name: "アグニス",
    element: "火",
    rarity: "SSR",
    thumbnailPath: "summons/agni.webp",
    tags: ["神石", "メイン"]
  },
  {
    id: "summon-bubz",
    kind: GbfMasterKind.summon,
    name: "ベルゼバブ",
    element: "無属性",
    rarity: "SSR",
    thumbnailPath: "summons/beelzebub.webp",
    tags: ["高難度", "周回"]
  },
  {
    id: "summon-yatima",
    kind: GbfMasterKind.summon,
    name: "ヤチマ",
    element: "無属性",
    rarity: "SSR",
    thumbnailPath: "summons/yatima.webp",
    tags: ["高難度"]
  },
  {
    id: "summon-lucifer",
    kind: GbfMasterKind.summon,
    name: "ルシフェル",
    element: "光",
    rarity: "SSR",
    thumbnailPath: "summons/lucifer.webp",
    tags: ["回復", "耐久"]
  },
  {
    id: "summon-godguard-brodia",
    kind: GbfMasterKind.summon,
    name: "ゴッドガード・ブローディア",
    element: "土",
    rarity: "SSR",
    thumbnailPath: "summons/godguard-brodia.webp",
    tags: ["防御"]
  },
  {
    id: "summon-sun",
    kind: GbfMasterKind.summon,
    name: "サン",
    element: "火",
    rarity: "SSR",
    thumbnailPath: "summons/sun.webp",
    tags: ["アーカルム", "周回"]
  }
];
