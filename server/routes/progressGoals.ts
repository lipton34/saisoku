import { Router } from "express";
import { Prisma } from "@prisma/client";
import { findProgressPreset, type ProgressCondition, type ProgressPreset, resolveProgressPreset, progressPresets } from "../data/progressPresets.js";
import { calculateProgress, collectRequiredStageIds, isStageDone, validateCompletedStageIds } from "../lib/progressEngine.js";
import { pinnedMaterialKeysFromSelection, validatePinnedMaterialKeys } from "../lib/progressPinnedMaterials.js";
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

function parseStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...new Set(value)]
    : null;
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
    groups: preset.groups,
    stages: preset.stages.map(({ id, name, groupId, kind, dependsOn, note }) => ({ id, name, groupId, kind, dependsOn, note })),
    isAvailable: preset.isAvailable,
    unavailableReason: preset.unavailableReason
  };
}

function definitionForGoal(goal: { presetId: string; presetVersion: number; targetId: string }) {
  const base = findProgressPreset(goal.presetId, goal.presetVersion);
  return base ? resolveProgressPreset(base, goal.targetId) : undefined;
}

function conditionState(
  condition: ProgressCondition,
  saved: { isChecked: boolean; numericValue: number | null } | undefined,
  sharedValues: Map<string, number>
) {
  const numericValue = condition.kind === "shared-number"
    ? sharedValues.get(condition.sharedValueKey ?? "") ?? 0
    : saved?.numericValue ?? 0;
  const isMet = condition.kind === "check"
    ? saved?.isChecked === true
    : numericValue >= (condition.requiredValue ?? 0);
  return { ...condition, numericValue, isChecked: saved?.isChecked ?? false, isMet };
}

type GoalRecord = NonNullable<Awaited<ReturnType<typeof findGoal>>>;

async function serializeGoal(
  goal: GoalRecord,
  options: {
    targetStageId?: string;
    completedStageIds?: string[];
    inventoryOverrides?: Map<string, number>;
  } = {}
) {
  const preset = definitionForGoal(goal);
  if (!preset) return { ...goal, error: "保存時のプリセット定義が見つかりません" };

  const finalRequiredIds = new Set(collectRequiredStageIds(preset, goal.goalStageId));
  const targetStageId = options.targetStageId ?? goal.goalStageId;
  if (!finalRequiredIds.has(targetStageId)) {
    throw new Error("目標中継点が最終ゴールの依存関係に含まれていません");
  }

  const [inventories, sharedValues] = await Promise.all([
    prisma.userItemInventory.findMany({ where: { ownerId: goal.ownerId } }),
    prisma.userProgressSharedValue.findMany({ where: { ownerId: goal.ownerId } })
  ]);
  const inventory = new Map(inventories.map((item) => [item.itemKey, item.ownedCount]));
  for (const [itemKey, ownedCount] of options.inventoryOverrides ?? []) inventory.set(itemKey, ownedCount);

  const completedIds = new Set(options.completedStageIds ?? goal.stages.filter((item) => item.isManuallyDone).map((item) => item.stageId));
  const conditionProgress = new Map(goal.conditions.map((item) => [item.conditionId, { isChecked: item.isChecked, numericValue: item.numericValue }]));
  const shared = new Map(sharedValues.map((item) => [item.valueKey, item.value]));
  const calculation = calculateProgress(preset, targetStageId, completedIds, inventory);

  const stages = preset.stages.map((stage) => {
    const requirements = stage.requirements.map((requirement) => {
      const ownedCount = inventory.get(requirement.itemKey) ?? 0;
      return { ...requirement, ownedCount, shortage: Math.max(requirement.requiredCount - ownedCount, 0), isMet: ownedCount >= requirement.requiredCount };
    });
    const conditions = stage.conditions.map((condition) => conditionState(condition, conditionProgress.get(condition.id), shared));
    const missingDependencyIds = collectRequiredStageIds(preset, stage.id)
      .filter((id) => id !== stage.id && stageFor(preset, id)?.kind === "stage" && !completedIds.has(id));
    return {
      ...stage,
      requirements,
      conditions,
      isManuallyDone: stage.kind === "stage" && completedIds.has(stage.id),
      isDone: isStageDone(stage, completedIds),
      canComplete: stage.kind === "stage" && missingDependencyIds.length === 0,
      missingDependencyIds
    };
  });

  const finalNormalStages = preset.stages.filter((stage) => finalRequiredIds.has(stage.id) && stage.kind === "stage");
  const completedCount = finalNormalStages.filter((stage) => completedIds.has(stage.id)).length;
  const currentStage = finalNormalStages.find((stage) => !completedIds.has(stage.id)) ?? null;

  return {
    id: goal.id,
    preset: publicPreset(preset),
    targetId: goal.targetId,
    targetName: goal.targetName,
    selection: goal.selection,
    pinnedMaterialKeys: pinnedMaterialKeysFromSelection(goal.selection),
    goalStageId: goal.goalStageId,
    targetStageId,
    availableTargetStageIds: [...finalRequiredIds],
    startingStageId: goal.startingStageId,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    stages,
    completedStageIds: [...completedIds],
    completedCount,
    totalStageCount: finalNormalStages.length,
    progressRate: finalNormalStages.length ? Math.round((completedCount / finalNormalStages.length) * 100) : 0,
    currentStage,
    calculation
  };
}

async function findGoal(id: string, owner: string) {
  return prisma.progressGoal.findFirst({
    where: { id, ownerId: owner },
    include: { stages: true, conditions: true, boardGoal: true }
  });
}

router.get("/presets", (_req, res) => {
  res.json({ presets: progressPresets.map(publicPreset) });
});

router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.progressGoal.findMany({
      where: { ownerId: ownerId(req) },
      include: { stages: true, conditions: true, boardGoal: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    res.json({ goals: await Promise.all(goals.map((goal) => serializeGoal(goal))) });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const record = await findGoal(req.params.id, ownerId(req));
    if (!record) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const targetStageId = typeof req.query.targetStageId === "string" ? req.query.targetStageId : undefined;
    res.json({ goal: await serializeGoal(record, { targetStageId }) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("目標中継点")) return res.status(400).json({ message: error.message });
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const base = findProgressPreset(typeof req.body.presetId === "string" ? req.body.presetId : "");
    if (!base) return res.status(400).json({ message: "プリセットを選択してください" });
    if (!base.isAvailable) return res.status(409).json({ message: `${base.name}は${base.unavailableReason ?? "準備中"}のため、まだ登録できません` });
    const target = base.targets.find((item) => item.id === req.body.targetId);
    if (!target) return res.status(400).json({ message: "対象の選択が不正です" });
    const preset = resolveProgressPreset(base, target.id);
    const goalStage = stageFor(preset, typeof req.body.goalStageId === "string" ? req.body.goalStageId : preset.stages.at(-1)?.id ?? "");
    if (!goalStage) return res.status(400).json({ message: "最終ゴールの選択が不正です" });

    let completedStageIds = parseStringArray(req.body.completedStageIds) ?? [];
    if (!completedStageIds.length && typeof req.body.startingStageId === "string") {
      completedStageIds = collectRequiredStageIds(preset, req.body.startingStageId)
        .filter((id) => stageFor(preset, id)?.kind === "stage");
    }
    const dependencyErrors = validateCompletedStageIds(preset, completedStageIds);
    if (dependencyErrors.length) return res.status(409).json({ message: "前提中継点が未完了です", errors: dependencyErrors });

    const userId = ownerId(req);
    const sortOrder = await prisma.progressGoal.count({ where: { ownerId: userId } });
    const goal = await prisma.$transaction(async (transaction) => {
      const created = await transaction.progressGoal.create({
        data: {
          presetId: preset.id,
          presetVersion: preset.version,
          presetName: preset.name,
          targetId: target.id,
          targetName: target.name,
          selection: typeof req.body.selection === "object" && req.body.selection ? req.body.selection : {},
          goalStageId: goalStage.id,
          startingStageId: null,
          sortOrder,
          ownerId: userId,
          stages: completedStageIds.length
            ? { create: completedStageIds.map((stageId) => ({ stageId, isManuallyDone: true, completedAt: new Date() })) }
            : undefined
        }
      });
      if (req.body.showOnBoard !== false) {
        await transaction.goal.create({
          data: {
            title: target.name,
            visibility: "personal",
            boardStatus: "unset",
            ownerId: userId,
            sourceProgressGoalId: created.id
          }
        });
      }
      return transaction.progressGoal.findUniqueOrThrow({
        where: { id: created.id },
        include: { stages: true, conditions: true, boardGoal: true }
      });
    });
    res.status(201).json({ goal: await serializeGoal(goal) });
  } catch (error) { next(error); }
});

router.put("/order", async (req, res, next) => {
  try {
    const goalIds = Array.isArray(req.body.goalIds) ? req.body.goalIds.filter((id: unknown) => typeof id === "string") : [];
    const ownedCount = await prisma.progressGoal.count({ where: { id: { in: goalIds }, ownerId: ownerId(req) } });
    if (ownedCount !== goalIds.length) return res.status(400).json({ message: "並び順を更新できません" });
    await prisma.$transaction(
      goalIds.map((id: string, sortOrder: number) => prisma.progressGoal.update({ where: { id }, data: { sortOrder } }))
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/board-link", async (req, res, next) => {
  try {
    const progressGoal = await prisma.progressGoal.findFirst({
      where: { id: req.params.id, ownerId: ownerId(req) },
      include: { boardGoal: true }
    });
    if (!progressGoal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    if (progressGoal.boardGoal) return res.json({ goal: progressGoal.boardGoal });
    const goal = await prisma.goal.create({
      data: {
        title: progressGoal.targetName,
        visibility: "personal",
        boardStatus: "unset",
        ownerId: ownerId(req),
        sourceProgressGoalId: progressGoal.id
      }
    });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/preview", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    if (!preset) return res.status(409).json({ message: "保存時のプリセット定義が見つかりません" });
    const completedStageIds = parseStringArray(req.body.completedStageIds);
    if (!completedStageIds) return res.status(400).json({ message: "完了済み中継点の形式が不正です" });
    const dependencyErrors = validateCompletedStageIds(preset, completedStageIds);
    const overrides = new Map<string, number>();
    if (req.body.inventoryOverrides !== undefined) {
      if (!Array.isArray(req.body.inventoryOverrides)) return res.status(400).json({ message: "所持数の形式が不正です" });
      for (const item of req.body.inventoryOverrides) {
        const ownedCount = parseCount(item?.ownedCount);
        if (typeof item?.itemKey !== "string" || ownedCount === null) return res.status(400).json({ message: "所持数の形式が不正です" });
        overrides.set(item.itemKey, ownedCount);
      }
    }
    const targetStageId = typeof req.body.targetStageId === "string" ? req.body.targetStageId : undefined;
    res.json({
      goal: await serializeGoal(goal, { completedStageIds, inventoryOverrides: overrides, targetStageId }),
      dependencyErrors
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("未知の中継点") || error.message.includes("集約目標") || error.message.includes("目標中継点"))) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id/progress", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    if (!preset) return res.status(409).json({ message: "保存時のプリセット定義が見つかりません" });
    const completedStageIds = parseStringArray(req.body.completedStageIds);
    if (!completedStageIds) return res.status(400).json({ message: "完了済み中継点の形式が不正です" });
    const dependencyErrors = validateCompletedStageIds(preset, completedStageIds);
    if (dependencyErrors.length) return res.status(409).json({ message: "前提中継点が未完了です", errors: dependencyErrors });
    const now = new Date();
    await prisma.$transaction(async (transaction) => {
      await transaction.progressStageProgress.deleteMany({ where: { goalId: goal.id } });
      if (completedStageIds.length) {
        await transaction.progressStageProgress.createMany({
          data: completedStageIds.map((stageId) => ({ goalId: goal.id, stageId, isManuallyDone: true, completedAt: now }))
        });
      }
      await transaction.progressGoal.update({ where: { id: goal.id }, data: { updatedAt: now } });
    });
    res.json({ goal: await serializeGoal((await findGoal(goal.id, ownerId(req)))!) });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("未知の中継点") || error.message.includes("集約目標"))) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.patch("/:id/inventory/:itemKey", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    const requirement = preset?.stages.flatMap((stage) => stage.requirements).find((item) => item.itemKey === req.params.itemKey);
    const ownedCount = parseCount(req.body.ownedCount);
    if (!requirement || ownedCount === null) return res.status(400).json({ message: "所持数は上限内の0以上の整数で入力してください" });
    await prisma.userItemInventory.upsert({
      where: { ownerId_itemKey: { ownerId: ownerId(req), itemKey: requirement.itemKey } },
      update: { itemName: requirement.itemName, ownedCount },
      create: { ownerId: ownerId(req), itemKey: requirement.itemKey, itemName: requirement.itemName, ownedCount }
    });
    await prisma.progressGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });
    res.json({ goal: await serializeGoal((await findGoal(goal.id, ownerId(req)))!) });
  } catch (error) { next(error); }
});

router.put("/:id/pinned-materials", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    if (!preset) return res.status(409).json({ message: "保存時のプリセット定義が見つかりません" });
    const knownItemKeys = new Set(preset.stages.flatMap((stage) => stage.requirements.map((item) => item.itemKey)));
    const result = validatePinnedMaterialKeys(req.body.itemKeys, knownItemKeys);
    if (!result.keys) return res.status(400).json({ message: result.message });
    const currentSelection = goal.selection && typeof goal.selection === "object" && !Array.isArray(goal.selection)
      ? goal.selection as Prisma.JsonObject
      : {};
    await prisma.progressGoal.update({
      where: { id: goal.id },
      data: {
        selection: { ...currentSelection, pinnedMaterialKeys: result.keys },
        updatedAt: new Date()
      }
    });
    const targetStageId = typeof req.body.targetStageId === "string" ? req.body.targetStageId : undefined;
    res.json({ goal: await serializeGoal((await findGoal(goal.id, ownerId(req)))!, { targetStageId }) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("目標中継点")) return res.status(400).json({ message: error.message });
    next(error);
  }
});

router.patch("/:id/conditions/:conditionId", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    const condition = preset && conditionFor(preset, req.params.conditionId);
    if (!condition) return res.status(400).json({ message: "条件が見つかりません" });
    if (condition.kind === "shared-number") {
      const value = parseCount(req.body.numericValue);
      if (value === null) return res.status(400).json({ message: "数値は上限内の0以上の整数で入力してください" });
      await prisma.userProgressSharedValue.upsert({
        where: { ownerId_valueKey: { ownerId: ownerId(req), valueKey: condition.sharedValueKey ?? "" } },
        update: { value },
        create: { ownerId: ownerId(req), valueKey: condition.sharedValueKey ?? "", value }
      });
    } else {
      const isChecked = condition.kind === "check" ? req.body.isChecked === true : undefined;
      const numericValue = condition.kind === "goal-number" ? parseCount(req.body.numericValue) : undefined;
      if (condition.kind === "goal-number" && numericValue === null) return res.status(400).json({ message: "数値は上限内の0以上の整数で入力してください" });
      await prisma.progressConditionProgress.upsert({
        where: { goalId_conditionId: { goalId: goal.id, conditionId: condition.id } },
        update: { ...(isChecked !== undefined ? { isChecked } : {}), ...(numericValue !== undefined ? { numericValue } : {}) },
        create: { goalId: goal.id, conditionId: condition.id, isChecked: isChecked ?? false, numericValue: numericValue ?? null }
      });
    }
    await prisma.progressGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });
    res.json({ goal: await serializeGoal((await findGoal(goal.id, ownerId(req)))!) });
  } catch (error) { next(error); }
});

router.post("/:id/stages/:stageId/complete", async (req, res, next) => {
  try {
    const goal = await findGoal(req.params.id, ownerId(req));
    if (!goal) return res.status(404).json({ message: "進捗目標が見つかりません" });
    const preset = definitionForGoal(goal);
    if (!preset || !stageFor(preset, req.params.stageId)) return res.status(400).json({ message: "中継点が見つかりません" });
    const completedStageIds = goal.stages.filter((item) => item.isManuallyDone).map((item) => item.stageId);
    completedStageIds.push(req.params.stageId);
    const dependencyErrors = validateCompletedStageIds(preset, completedStageIds);
    if (dependencyErrors.length) return res.status(409).json({ message: "前提中継点が未完了です", errors: dependencyErrors });
    await prisma.progressStageProgress.upsert({
      where: { goalId_stageId: { goalId: goal.id, stageId: req.params.stageId } },
      update: { isManuallyDone: true, completedAt: new Date() },
      create: { goalId: goal.id, stageId: req.params.stageId, isManuallyDone: true, completedAt: new Date() }
    });
    res.json({ goal: await serializeGoal((await findGoal(goal.id, ownerId(req)))!) });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("未知の中継点") || error.message.includes("集約目標"))) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.progressGoal.deleteMany({ where: { id: req.params.id, ownerId: ownerId(req) } });
    if (!deleted.count) return res.status(404).json({ message: "進捗目標が見つかりません" });
    res.status(204).send();
  } catch (error) { next(error); }
});

export { router as progressGoalsRouter };
