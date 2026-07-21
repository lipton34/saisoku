import { Router } from "express";
import { findProgressPreset, type ProgressCondition, type ProgressPreset, type ProgressStage, progressPresets } from "../data/progressPresets.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();
router.use(requireAuth);

const MAX_COUNT = 9_999_999;

function ownerId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return req.user?.id ?? "";
}

function parseCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 && count <= MAX_COUNT ? count : null;
}

function stageFor(preset: ProgressPreset, stageId: string) {
  return preset.stages.find((stage) => stage.id === stageId);
}

function conditionFor(preset: ProgressPreset, conditionId: string) {
  for (const stage of preset.stages) {
    const condition = stage.conditions.find((item) => item.id === conditionId);
    if (condition) return condition;
  }
  return undefined;
}

function publicPreset(preset: ProgressPreset) {
  return {
    id: preset.id,
    version: preset.version,
    name: preset.name,
    targetLabel: preset.targetLabel,
    selectionLabel: preset.selectionLabel,
    selectionOptions: preset.selectionOptions,
    targets: preset.targets,
    stages: preset.stages.map(({ id, name }) => ({ id, name })),
    isAvailable: preset.isAvailable,
    unavailableReason: preset.unavailableReason
  };
}

function stageState(
  stage: ProgressStage,
  isManuallyDone: boolean,
  inventory: Map<string, number>,
  conditions: Map<string, { isChecked: boolean; numericValue: number | null }>,
  sharedValues: Map<string, number>
) {
  const requirements = stage.requirements.map((requirement) => {
    const ownedCount = inventory.get(requirement.itemKey) ?? 0;
    return { ...requirement, ownedCount, shortage: Math.max(requirement.requiredCount - ownedCount, 0), isMet: ownedCount >= requirement.requiredCount };
  });
  const conditionState = stage.conditions.map((condition) => {
    const saved = conditions.get(condition.id);
    const numericValue = condition.kind === "shared-number" ? sharedValues.get(condition.sharedValueKey ?? "") ?? 0 : saved?.numericValue ?? 0;
    const isMet = condition.kind === "check" ? saved?.isChecked === true : numericValue >= (condition.requiredValue ?? 0);
    return { ...condition, numericValue, isChecked: saved?.isChecked ?? false, isMet };
  });
  const isEligible = requirements.length + conditionState.length > 0 && requirements.every((item) => item.isMet) && conditionState.every((item) => item.isMet);
  return { requirements, conditions: conditionState, isManuallyDone, isEligible, isDone: isManuallyDone };
}

async function serializeGoal(goal: Awaited<ReturnType<typeof findGoal>>) {
  if (!goal) return null;
  const preset = findProgressPreset(goal.presetId);
  if (!preset) {
    return { ...goal, error: "プリセット定義が見つかりません" };
  }
  const [inventories, sharedValues] = await Promise.all([
    prisma.userItemInventory.findMany({ where: { ownerId: goal.ownerId } }),
    prisma.userProgressSharedValue.findMany({ where: { ownerId: goal.ownerId } })
  ]);
  const inventory = new Map(inventories.map((item) => [item.itemKey, item.ownedCount]));
  const conditionProgress = new Map(goal.conditions.map((item) => [item.conditionId, { isChecked: item.isChecked, numericValue: item.numericValue }]));
  const stageProgress = new Map(goal.stages.map((item) => [item.stageId, item.isManuallyDone]));
  const shared = new Map(sharedValues.map((item) => [item.valueKey, item.value]));
  const stages = preset.stages.map((stage) => ({ ...stage, ...stageState(stage, stageProgress.get(stage.id) ?? false, inventory, conditionProgress, shared) }));
  const completedCount = stages.filter((stage) => stage.isDone).length;
  const currentStage = stages.find((stage) => !stage.isDone) ?? null;
  return {
    id: goal.id,
    preset: publicPreset(preset),
    targetId: goal.targetId,
    targetName: goal.targetName,
    selection: goal.selection,
    goalStageId: goal.goalStageId,
    startingStageId: goal.startingStageId,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    stages,
    completedCount,
    totalStageCount: stages.length,
    progressRate: stages.length ? Math.round((completedCount / stages.length) * 100) : 0,
    currentStage
  };
}

async function findGoal(id: string, owner: string) {
  return prisma.progressGoal.findFirst({
    where: { id, ownerId: owner },
    include: { stages: true, conditions: true }
  });
}

router.get("/presets", (_req, res) => {
  res.json({ presets: progressPresets.map(publicPreset) });
});

router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.progressGoal.findMany({
      where: { ownerId: ownerId(req) },
      include: { stages: true, conditions: true },
      orderBy: { updatedAt: "desc" }
    });
    res.json({ goals: (await Promise.all(goals.map(serializeGoal))).filter(Boolean) });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const goal = await serializeGoal(await findGoal(req.params.id, ownerId(req)));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    res.json({ goal });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const preset = findProgressPreset(typeof req.body.presetId === "string" ? req.body.presetId : "");
    if (!preset) return res.status(400).json({ message: "プリセットを選択してください" });
    if (!preset.isAvailable) return res.status(409).json({ message: `${preset.name}は${preset.unavailableReason ?? "準備中"}のため、まだ登録できません` });
    const target = preset.targets.find((item) => item.id === req.body.targetId);
    const goalStage = stageFor(preset, req.body.goalStageId);
    const startingStage = req.body.startingStageId ? stageFor(preset, req.body.startingStageId) : undefined;
    if (!target || !goalStage || (req.body.startingStageId && !startingStage)) return res.status(400).json({ message: "対象または段階の選択が不正です" });
    const startIndex = startingStage ? preset.stages.findIndex((stage) => stage.id === startingStage.id) : -1;
    const goal = await prisma.progressGoal.create({
      data: {
        presetId: preset.id, presetVersion: preset.version, presetName: preset.name,
        targetId: target.id, targetName: target.name,
        selection: typeof req.body.selection === "object" && req.body.selection ? req.body.selection : {},
        goalStageId: goalStage.id, startingStageId: startingStage?.id, ownerId: ownerId(req),
        stages: startIndex >= 0 ? { create: preset.stages.slice(0, startIndex + 1).map((stage) => ({ stageId: stage.id, isManuallyDone: true, completedAt: new Date() })) } : undefined
      },
      include: { stages: true, conditions: true }
    });
    res.status(201).json({ goal: await serializeGoal(goal) });
  } catch (error) { next(error); }
});

router.patch("/:id/inventory/:itemKey", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = findProgressPreset(goal.presetId);
    const requirement = preset?.stages.flatMap((stage) => stage.requirements).find((item) => item.itemKey === req.params.itemKey);
    const ownedCount = parseCount(req.body.ownedCount);
    if (!requirement || ownedCount === null) return res.status(400).json({ message: "所持数は上限内の0以上の整数で入力してください" });
    await prisma.userItemInventory.upsert({ where: { ownerId_itemKey: { ownerId: ownerId(req), itemKey: requirement.itemKey } }, update: { ownedCount }, create: { ownerId: ownerId(req), itemKey: requirement.itemKey, itemName: requirement.itemName, ownedCount } });
    await prisma.progressGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });
    res.json({ goal: await serializeGoal(await findGoal(goal.id, ownerId(req))) });
  } catch (error) { next(error); }
});

router.patch("/:id/conditions/:conditionId", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const condition = findProgressPreset(goal.presetId) && conditionFor(findProgressPreset(goal.presetId)!, req.params.conditionId);
    if (!condition) return res.status(400).json({ message: "条件が見つかりません" });
    if (condition.kind === "shared-number") {
      const value = parseCount(req.body.numericValue);
      if (value === null) return res.status(400).json({ message: "数値は上限内の0以上の整数で入力してください" });
      await prisma.userProgressSharedValue.upsert({ where: { ownerId_valueKey: { ownerId: ownerId(req), valueKey: condition.sharedValueKey ?? "" } }, update: { value }, create: { ownerId: ownerId(req), valueKey: condition.sharedValueKey ?? "", value } });
    } else {
      const isChecked = condition.kind === "check" ? req.body.isChecked === true : undefined;
      const numericValue = condition.kind === "goal-number" ? parseCount(req.body.numericValue) : undefined;
      if (condition.kind === "goal-number" && numericValue === null) return res.status(400).json({ message: "数値は上限内の0以上の整数で入力してください" });
      await prisma.progressConditionProgress.upsert({ where: { goalId_conditionId: { goalId: goal.id, conditionId: condition.id } }, update: { ...(isChecked !== undefined ? { isChecked } : {}), ...(numericValue !== undefined ? { numericValue } : {}) }, create: { goalId: goal.id, conditionId: condition.id, isChecked: isChecked ?? false, numericValue: numericValue ?? null } });
    }
    await prisma.progressGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });
    res.json({ goal: await serializeGoal(await findGoal(goal.id, ownerId(req))) });
  } catch (error) { next(error); }
});

router.post("/:id/stages/:stageId/complete", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const serialized = await serializeGoal(goal);
    const stage = serialized && "stages" in serialized
      ? (serialized.stages as Array<{ id: string; isEligible: boolean; isManuallyDone: boolean }>).find((item) => item.id === req.params.stageId)
      : undefined;
    if (!stage) return res.status(400).json({ message: "段階が見つかりません" });
    if (!stage.isEligible && !stage.isManuallyDone) return res.status(409).json({ message: "必要素材と条件を満たしてから完了してください" });
    await prisma.progressStageProgress.upsert({ where: { goalId_stageId: { goalId: goal.id, stageId: req.params.stageId } }, update: { isManuallyDone: true, completedAt: new Date() }, create: { goalId: goal.id, stageId: req.params.stageId, isManuallyDone: true, completedAt: new Date() } });
    res.json({ goal: await serializeGoal(await findGoal(goal.id, ownerId(req))) });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.progressGoal.deleteMany({ where: { id: req.params.id, ownerId: ownerId(req) } });
    if (!deleted.count) return res.status(404).json({ message: "進捗目標が見つかりません" });
    res.status(204).send();
  } catch (error) { next(error); }
});

export { router as progressGoalsRouter };
