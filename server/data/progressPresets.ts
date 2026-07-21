export type ProgressConditionKind = "check" | "shared-number" | "goal-number";

export type ProgressRequirement = {
  itemKey: string;
  itemName: string;
  requiredCount: number;
};

export type ProgressCondition = {
  id: string;
  label: string;
  kind: ProgressConditionKind;
  requiredValue?: number;
  sharedValueKey?: string;
  note?: string;
};

export type ProgressStage = {
  id: string;
  name: string;
  requirements: ProgressRequirement[];
  conditions: ProgressCondition[];
};

export type ProgressPresetTarget = { id: string; name: string };

export type ProgressPreset = {
  id: string;
  version: number;
  name: string;
  targetLabel: string;
  selectionLabel?: string;
  selectionOptions?: string[];
  targets: ProgressPresetTarget[];
  stages: ProgressStage[];
  /** Verified requirements are required before a preset can be registered. */
  isAvailable: boolean;
  unavailableReason?: string;
};

const stages = (...names: string[]): ProgressStage[] =>
  names.map((name, index) => ({
    id: `stage-${index + 1}`,
    name,
    requirements: [],
    conditions: []
  }));

const elements = ["火", "水", "土", "風", "光", "闇"].map((name) => ({ id: name, name }));
const eternals = ["ウーノ", "ソーン", "サラーサ", "カトル", "フュンフ", "シス", "シエテ", "オクトー", "ニオ", "エッセル"].map(
  (name) => ({ id: name, name })
);
const evokers = ["アラナン", "カイム", "ガイゼンボーガ", "ハーゼリーラ", "カッツェリーラ", "ニーア", "フラウ", "エスタリオラ", "ロベリア", "マリア・テレサ"].map(
  (name) => ({ id: name, name })
);

// Requirement data is intentionally unavailable until it has been verified against
// current in-game information. The UI may display these definitions, but registration
// is disabled so an empty or inaccurate preset is never published.
export const progressPresets: ProgressPreset[] = [
  {
    id: "terminus-weapon",
    version: 1,
    name: "終末武器",
    targetLabel: "属性",
    selectionLabel: "加護",
    selectionOptions: ["マグナ", "神石"],
    targets: elements,
    stages: stages("交換", "4凸", "5凸", "Lv210", "Lv220", "Lv230", "Lv240", "Lv250"),
    isAvailable: false,
    unavailableReason: "必要素材・条件を検証中"
  },
  { id: "eternals", version: 1, name: "十天衆", targetLabel: "十天衆", targets: eternals, stages: stages("加入", "最終", "Lv110", "Lv120", "Lv130", "Lv140", "Lv150"), isAvailable: false, unavailableReason: "必要素材・条件を検証中" },
  { id: "evokers", version: 1, name: "十賢者", targetLabel: "十賢者", targets: evokers, stages: stages("加入", "礎武器5凸", "領域全解放", "最終", "Lv100", "4アビ取得"), isAvailable: false, unavailableReason: "必要素材・条件を検証中" },
  { id: "draconic-weapon", version: 1, name: "ドラゴニックウェポン", targetLabel: "属性", targets: elements, stages: stages("交換", "4凸", "5凸", "オリジン化"), isAvailable: false, unavailableReason: "必要素材・条件を検証中" },
  { id: "destruction-weapon", version: 1, name: "破壊武器", targetLabel: "属性", targets: elements, stages: stages("交換", "4凸", "5凸"), isAvailable: false, unavailableReason: "必要素材・条件を検証中" },
  { id: "origin-class", version: 1, name: "オリジンクラス", targetLabel: "ジョブ", targets: [], stages: stages("前提クエスト", "取得", "Lv10", "Lv20", "Lv30", "Lv40", "Lv50"), isAvailable: false, unavailableReason: "対象ジョブと必要素材・条件を検証中" },
  { id: "astral-weapon", version: 1, name: "極星器", targetLabel: "武器種", targets: [], stages: stages("交換", "4凸", "5凸", "覚醒Lv最大"), isAvailable: false, unavailableReason: "対象武器種・覚醒差分を検証中" },
  { id: "revanse-weapon", version: 1, name: "レヴァンス武器", targetLabel: "武器", targets: [], stages: stages("入手", "4凸", "覚醒Lv15", "特殊強化", "覚醒Lv20"), isAvailable: false, unavailableReason: "対象武器・覚醒差分と必要素材を検証中" }
];

export function findProgressPreset(presetId: string) {
  return progressPresets.find((preset) => preset.id === presetId);
}
