import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

export const jobMasterSeeds: GbfMasterSeedItem[] = [
  { id: "job-kengo", kind: GbfMasterKind.job, name: "剣豪", tags: ["奥義", "高難度"] },
  { id: "job-yamato", kind: GbfMasterKind.job, name: "ヤマト", tags: ["予兆対応", "高難度"] },
  { id: "job-manadiver", kind: GbfMasterKind.job, name: "マナダイバー", tags: ["フルオート", "周回"] },
  { id: "job-berserker", kind: GbfMasterKind.job, name: "ベルセルク", tags: ["火力", "周回"] },
  { id: "job-paladin", kind: GbfMasterKind.job, name: "パラディン", tags: ["耐久", "高難度"] },
  { id: "job-robinhood", kind: GbfMasterKind.job, name: "ロビンフッド", tags: ["弱体", "高難度"] },
  { id: "job-chaos-ruler", kind: GbfMasterKind.job, name: "カオスルーダー", tags: ["弱体"] },
  { id: "job-relic-buster", kind: GbfMasterKind.job, name: "レリックバスター", tags: ["周回"] },
  { id: "job-wrestler", kind: GbfMasterKind.job, name: "レスラー", tags: ["短期", "周回"] }
];
