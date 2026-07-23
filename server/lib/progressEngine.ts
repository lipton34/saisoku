import type { ProgressPreset, ProgressRequirement, ProgressStage } from "../data/progressPresets.js";

export type ProgressCalculation = {
  requiredStageIds: string[];
  pendingStageIds: string[];
  requirements: Array<ProgressRequirement & { ownedCount: number; shortage: number }>;
};

function stageMap(preset: ProgressPreset) {
  return new Map(preset.stages.map((stage) => [stage.id, stage]));
}

export function collectRequiredStageIds(preset: ProgressPreset, targetStageId: string) {
  const byId = stageMap(preset);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(stageId: string) {
    const stage = byId.get(stageId);
    if (!stage) throw new Error(`未知の中継点IDです: ${stageId}`);
    if (visiting.has(stageId)) throw new Error(`中継点の依存関係が循環しています: ${stageId}`);
    if (visited.has(stageId)) return;
    visiting.add(stageId);
    for (const dependencyId of stage.dependsOn) visit(dependencyId);
    visiting.delete(stageId);
    visited.add(stageId);
  }

  visit(targetStageId);
  return preset.stages.filter((stage) => visited.has(stage.id)).map((stage) => stage.id);
}

export function validateCompletedStageIds(preset: ProgressPreset, completedStageIds: Iterable<string>) {
  const byId = stageMap(preset);
  const completed = new Set(completedStageIds);
  const errors: Array<{ stageId: string; missingDependencyIds: string[] }> = [];

  for (const stageId of completed) {
    const stage = byId.get(stageId);
    if (!stage) throw new Error(`未知の中継点IDです: ${stageId}`);
    if (stage.kind === "milestone") throw new Error(`集約目標は手動完了できません: ${stageId}`);
    const required = collectRequiredStageIds(preset, stageId)
      .filter((id) => id !== stageId && byId.get(id)?.kind === "stage");
    const missingDependencyIds = required.filter((id) => !completed.has(id));
    if (missingDependencyIds.length) errors.push({ stageId, missingDependencyIds });
  }

  return errors;
}

export function isStageDone(stage: ProgressStage, completedStageIds: Set<string>) {
  return stage.kind === "milestone"
    ? stage.dependsOn.every((dependencyId) => completedStageIds.has(dependencyId))
    : completedStageIds.has(stage.id);
}

export function calculateProgress(
  preset: ProgressPreset,
  targetStageId: string,
  completedStageIds: Iterable<string>,
  inventory: ReadonlyMap<string, number>
): ProgressCalculation {
  const completed = new Set(completedStageIds);
  const requiredStageIds = collectRequiredStageIds(preset, targetStageId);
  const byId = stageMap(preset);
  const pendingStageIds = requiredStageIds.filter((id) => {
    const stage = byId.get(id);
    return stage?.kind === "stage" && !completed.has(id);
  });
  const totals = new Map<string, ProgressRequirement>();

  for (const stageId of pendingStageIds) {
    for (const requirement of byId.get(stageId)?.requirements ?? []) {
      const current = totals.get(requirement.itemKey);
      totals.set(requirement.itemKey, {
        ...requirement,
        requiredCount: (current?.requiredCount ?? 0) + requirement.requiredCount
      });
    }
  }

  return {
    requiredStageIds,
    pendingStageIds,
    requirements: [...totals.values()].map((requirement) => {
      const ownedCount = inventory.get(requirement.itemKey) ?? 0;
      return { ...requirement, ownedCount, shortage: Math.max(requirement.requiredCount - ownedCount, 0) };
    })
  };
}

export function validateProgressPreset(preset: ProgressPreset) {
  const errors: string[] = [];
  const groupIds = new Set<string>();
  const stageIds = new Set<string>();

  for (const group of preset.groups) {
    if (groupIds.has(group.id)) errors.push(`工程グループIDが重複しています: ${group.id}`);
    groupIds.add(group.id);
  }
  for (const stage of preset.stages) {
    if (stageIds.has(stage.id)) errors.push(`中継点IDが重複しています: ${stage.id}`);
    stageIds.add(stage.id);
    if (!groupIds.has(stage.groupId)) errors.push(`工程グループが見つかりません: ${stage.id}/${stage.groupId}`);
    if (stage.kind === "milestone" && stage.requirements.length) errors.push(`集約目標に素材を設定できません: ${stage.id}`);
    for (const requirement of stage.requirements) {
      if (!Number.isInteger(requirement.requiredCount) || requirement.requiredCount <= 0) {
        errors.push(`必要数は1以上の整数にしてください: ${stage.id}/${requirement.itemKey}`);
      }
    }
  }
  for (const stage of preset.stages) {
    try {
      collectRequiredStageIds(preset, stage.id);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return [...new Set(errors)];
}
