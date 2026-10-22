import type { ProgressGoal, ProgressPreset } from "./apiTypes";

export function dependencyClosure(preset: ProgressPreset, stageId: string, found = new Set<string>()) {
  const stage = preset.stages.find((item) => item.id === stageId);
  if (!stage || found.has(stageId)) return found;
  found.add(stageId);
  stage.dependsOn.forEach((id) => dependencyClosure(preset, id, found));
  return found;
}

export type MaterialRequirement = ProgressGoal["calculation"]["requirements"][number];
export type MaterialTab = "shortage" | "arcarum" | "battle" | "other" | "all";

export const materialTabs: Array<{ id: MaterialTab; label: string }> = [
  { id: "shortage", label: "不足素材" },
  { id: "arcarum", label: "アーカルム" },
  { id: "battle", label: "属性・マルチ" },
  { id: "other", label: "共通・その他" },
  { id: "all", label: "すべて" }
];

export const progressGroupDescriptions: Record<string, string> = {
  "arcarum-summon": "召喚石の交換から5凸まで",
  "foundation-weapon": "礎武器の交換から5凸まで",
  domain: "第1解放から全解放まで"
};

export function materialCategory(itemKey: string): Exclude<MaterialTab, "shortage" | "all"> {
  if (/(sephira|astra|idea|veritas|verum|haze|bright|fragment|new-world)/.test(itemKey)) return "arcarum";
  if (/(anima|magna|element|psyche|jewel|rubble|tragedy|insular|gale-rock|thunder-wheel|todestrieb|stone-fragment)/.test(itemKey)) return "battle";
  return "other";
}

