import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

export const weaponMasterSeeds: GbfMasterSeedItem[] = [
  {
    id: "weapon-ultima-katana",
    kind: GbfMasterKind.weapon,
    name: "オメガ刀",
    element: "無属性",
    rarity: "SSR",
    thumbnailPath: "weapons/omega-katana.webp",
    tags: ["高難度"],
    metadata: { weaponType: "刀", series: "オメガ" }
  },
  {
    id: "weapon-ultima",
    kind: GbfMasterKind.weapon,
    name: "オメガ武器",
    element: "無属性",
    rarity: "SSR",
    thumbnailPath: "weapons/omega.webp",
    tags: ["高難度"],
    metadata: { series: "オメガ" }
  },
  {
    id: "weapon-dark-opus",
    kind: GbfMasterKind.weapon,
    name: "終末武器",
    element: "可変",
    rarity: "SSR",
    thumbnailPath: "weapons/dark-opus.webp",
    tags: ["必須級"],
    metadata: { series: "終末" }
  },
  {
    id: "weapon-water-ougi",
    kind: GbfMasterKind.weapon,
    name: "水属性の奥義寄せ武器",
    element: "水",
    rarity: "SSR",
    thumbnailPath: "weapons/water-ougi.webp",
    tags: ["奥義"],
    metadata: { series: "奥義" }
  },
  {
    id: "weapon-fire-limited",
    kind: GbfMasterKind.weapon,
    name: "火リミ武器",
    element: "火",
    rarity: "SSR",
    thumbnailPath: "weapons/fire-limited.webp",
    tags: ["周回"],
    metadata: { series: "リミテッド" }
  },
  {
    id: "weapon-kyokusei",
    kind: GbfMasterKind.weapon,
    name: "極星器",
    element: "無属性",
    rarity: "SSR",
    thumbnailPath: "weapons/kyokusei.webp",
    tags: ["周回"],
    metadata: { series: "極星器" }
  },
  {
    id: "weapon-hp-flex",
    kind: GbfMasterKind.weapon,
    name: "HPを確保できる武器",
    element: "可変",
    rarity: "SSR",
    thumbnailPath: "weapons/hp-flex.webp",
    tags: ["耐久"]
  }
];
