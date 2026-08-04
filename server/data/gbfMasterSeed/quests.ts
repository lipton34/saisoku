import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

export const questMasterSeeds: GbfMasterSeedItem[] = [
  {
    id: "quest-dark-rapture-zero",
    kind: GbfMasterKind.quest,
    name: "ダーク・ラプチャー・ゼロ",
    element: "無属性",
    category: "高難度マルチバトル",
    tags: ["高難度", "6人マルチ"],
    aliases: ["ルシファー・ゼロ", "ルシゼロ", "スパルシ"]
  },
  {
    id: "quest-the-world-of-six-dragons",
    kind: GbfMasterKind.quest,
    name: "天元たる六色の理",
    element: "無属性",
    category: "高難度マルチバトル",
    tags: ["高難度", "6人マルチ"],
    aliases: ["天元", "天六"]
  }
];
