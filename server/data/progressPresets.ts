import { darkOpusProgressPreset, darkOpusProgressPresetVersion1 } from "./darkOpusProgressPreset.js";
import { draconicProgressPreset } from "./draconicProgressPreset.js";
import { eternalProgressPreset, eternalProgressPresetVersion2 } from "./eternalProgressPreset.js";
import { evokerProgressPreset } from "./evokerProgressPreset.js";

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
  groupId: string;
  kind: "stage" | "milestone";
  dependsOn: string[];
  note?: string;
  requirements: ProgressRequirement[];
  conditions: ProgressCondition[];
};

export type ProgressPresetTarget = { id: string; name: string };

export type ProgressPresetField =
  | { id: string; label: string; type: "select"; options: string[]; defaultValue: string }
  | { id: string; label: string; type: "integer"; min: number; max: number; defaultValue: number };

export type ProgressStageGroup = {
  id: string;
  name: string;
  sortOrder: number;
};

export type ProgressPreset = {
  id: string;
  version: number;
  name: string;
  targetLabel: string;
  selectionLabel?: string;
  selectionOptions?: string[];
  fields?: ProgressPresetField[];
  targets: ProgressPresetTarget[];
  groups: ProgressStageGroup[];
  stages: ProgressStage[];
  resolveStages?: (targetId: string, selection: Record<string, unknown>) => ProgressStage[];
  /** Verified requirements are required before a preset can be registered. */
  isAvailable: boolean;
  unavailableReason?: string;
};

const stages = (...names: string[]): ProgressStage[] =>
  names.map((name, index) => ({
    id: `stage-${index + 1}`,
    name,
    groupId: "main",
    kind: "stage",
    dependsOn: index ? [`stage-${index}`] : [],
    requirements: [],
    conditions: []
  }));

const defaultGroup: ProgressStageGroup[] = [{ id: "main", name: "進捗", sortOrder: 0 }];

const elements = ["火", "水", "土", "風", "光", "闇"].map((name) => ({ id: name, name }));
// Requirement data is intentionally unavailable until it has been verified against
// current in-game information. The UI may display these definitions, but registration
// is disabled so an empty or inaccurate preset is never published.
export const progressPresets: ProgressPreset[] = [
  darkOpusProgressPreset,
  eternalProgressPreset,
  evokerProgressPreset,
  draconicProgressPreset,
  { id: "destruction-weapon", version: 1, name: "破壊武器", targetLabel: "属性", targets: elements, groups: defaultGroup, stages: stages("交換", "4凸", "5凸"), isAvailable: false, unavailableReason: "必要素材・条件を検証中" },
  { id: "origin-class", version: 1, name: "オリジンクラス", targetLabel: "ジョブ", targets: [], groups: defaultGroup, stages: stages("前提クエスト", "取得", "Lv10", "Lv20", "Lv30", "Lv40", "Lv50"), isAvailable: false, unavailableReason: "対象ジョブと必要素材・条件を検証中" },
  { id: "astral-weapon", version: 1, name: "極星器", targetLabel: "武器種", targets: [], groups: defaultGroup, stages: stages("交換", "4凸", "5凸", "覚醒Lv最大"), isAvailable: false, unavailableReason: "対象武器種・覚醒差分を検証中" },
  { id: "revanse-weapon", version: 1, name: "レヴァンス武器", targetLabel: "武器", targets: [], groups: defaultGroup, stages: stages("入手", "4凸", "覚醒Lv15", "特殊強化", "覚醒Lv20"), isAvailable: false, unavailableReason: "対象武器・覚醒差分と必要素材を検証中" }
];

const progressPresetDefinitions: ProgressPreset[] = [
  ...progressPresets,
  darkOpusProgressPresetVersion1,
  eternalProgressPresetVersion2
];

export function findProgressPreset(presetId: string, version?: number) {
  const canonicalId = presetId === "terminus-weapon"
    ? "dark-opus"
    : presetId === "draconic-weapon" ? "draconic" : presetId;
  return progressPresetDefinitions.find((preset) => preset.id === canonicalId && (version === undefined || preset.version === version));
}

export function resolveProgressPreset(preset: ProgressPreset, targetId: string, selection: Record<string, unknown> = {}): ProgressPreset {
  return preset.resolveStages ? { ...preset, stages: preset.resolveStages(targetId, selection) } : preset;
}
