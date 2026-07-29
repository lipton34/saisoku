import { Prisma } from "@prisma/client";
import { Router, type Request } from "express";
import { findProgressPreset, resolveProgressPreset } from "../data/progressPresets.js";
import { collectRequiredStageIds } from "../lib/progressEngine.js";
import { effectiveSubTaskDone } from "../lib/goalSubTasks.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();
router.use(requireAuth);

const boardStatuses = new Set(["unset", "now", "later"]);
const visibilities = new Set(["personal", "crew"]);
const subTaskKinds = new Set(["standard", "round", "progress"]);
const MAX_SUB_TASKS = 50;
const MAX_SUB_TASK_TITLE = 100;

function ownerId(req: Request) {
  return req.user?.id ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return text(value) || null;
}

function date(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const goalInclude = {
  owner: { select: { id: true, username: true, displayName: true } },
  sourceRoundGoal: true,
  sourceProgressGoal: {
    select: {
      id: true,
      presetName: true,
      targetName: true,
      goalStageId: true,
      updatedAt: true
    }
  },
  subTasks: {
    include: {
      sourceRoundGoal: true,
      sourceProgressGoal: {
        include: { stages: true }
      }
    },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }]
  }
};

type IncludedGoal = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;
type IncludedSubTask = IncludedGoal["subTasks"][number];

function accessibleWhere(id: string, userId: string) {
  return { id, OR: [{ ownerId: userId }, { visibility: "crew" }] };
}

function canEdit(goal: { ownerId: string; visibility: string }, userId: string) {
  return goal.ownerId === userId || goal.visibility === "crew";
}

function progressState(item: IncludedSubTask) {
  const goal = item.sourceProgressGoal;
  if (!goal) return { isDone: false, progressRate: 0 };
  const base = findProgressPreset(goal.presetId, goal.presetVersion);
  if (!base) return { isDone: false, progressRate: 0 };
  const selection = goal.selection && typeof goal.selection === "object" && !Array.isArray(goal.selection)
    ? goal.selection as Prisma.JsonObject
    : {};
  const preset = resolveProgressPreset(base, goal.targetId, selection);
  const required = collectRequiredStageIds(preset, goal.goalStageId)
    .filter((stageId) => preset.stages.find((stage) => stage.id === stageId)?.kind === "stage");
  const completed = new Set(goal.stages.filter((stage) => stage.isManuallyDone).map((stage) => stage.stageId));
  const completedCount = required.filter((stageId) => completed.has(stageId)).length;
  return {
    isDone: required.length > 0 && completedCount === required.length,
    progressRate: required.length ? Math.round((completedCount / required.length) * 100) : 0
  };
}

function serializeSubTask(item: IncludedSubTask) {
  const progress = progressState(item);
  const automaticIsDone = item.kind === "standard"
    ? item.isDone
    : item.kind === "round"
      ? Boolean(item.sourceRoundGoal && item.sourceRoundGoal.currentCount >= item.sourceRoundGoal.targetCount)
      : progress.isDone;
  const effectiveIsDone = effectiveSubTaskDone(item.kind, item.isDone, automaticIsDone, item.completionOverride);
  return {
    id: item.id,
    goalId: item.goalId,
    kind: item.kind,
    title: item.kind === "standard"
      ? item.title
      : item.kind === "round"
        ? item.sourceRoundGoal?.title ?? null
        : item.sourceProgressGoal?.targetName ?? null,
    isDone: item.isDone,
    automaticIsDone,
    effectiveIsDone,
    completionOverride: item.completionOverride,
    sortOrder: item.sortOrder,
    sourceRoundGoalId: item.sourceRoundGoalId,
    sourceProgressGoalId: item.sourceProgressGoalId,
    sourceRoundGoal: item.sourceRoundGoal,
    sourceProgressGoal: item.sourceProgressGoal
      ? {
          id: item.sourceProgressGoal.id,
          targetName: item.sourceProgressGoal.targetName,
          progressRate: progress.progressRate
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function serializeGoal(goal: IncludedGoal) {
  const subTasks = goal.subTasks.map(serializeSubTask);
  return {
    ...goal,
    subTasks,
    completedSubTaskCount: subTasks.filter((item) => item.effectiveIsDone).length,
    totalSubTaskCount: subTasks.length
  };
}

type SubTaskInput = {
  kind: "standard" | "round" | "progress";
  title: string | null;
  sourceRoundGoalId: string | null;
  sourceProgressGoalId: string | null;
};

function parseSubTaskInput(value: unknown): SubTaskInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const kind = text(record.kind) || "standard";
  if (!subTaskKinds.has(kind)) return null;
  if (kind === "standard") {
    const title = text(record.title);
    return title && title.length <= MAX_SUB_TASK_TITLE
      ? { kind, title, sourceRoundGoalId: null, sourceProgressGoalId: null }
      : null;
  }
  const sourceId = text(kind === "round" ? record.sourceRoundGoalId : record.sourceProgressGoalId);
  if (!sourceId) return null;
  return {
    kind: kind as "round" | "progress",
    title: null,
    sourceRoundGoalId: kind === "round" ? sourceId : null,
    sourceProgressGoalId: kind === "progress" ? sourceId : null
  };
}

async function validateSubTaskInputs(inputs: SubTaskInput[], userId: string, visibility: string) {
  const roundIds = inputs.flatMap((item) => item.sourceRoundGoalId ? [item.sourceRoundGoalId] : []);
  const progressIds = inputs.flatMap((item) => item.sourceProgressGoalId ? [item.sourceProgressGoalId] : []);
  if (new Set(roundIds).size !== roundIds.length || new Set(progressIds).size !== progressIds.length) {
    return "同じ数量目標または進捗目標を重複して追加できません";
  }
  if (visibility === "crew" && (roundIds.length || progressIds.length)) {
    return "団内目標には数量目標・進捗目標をリンクできません";
  }
  const [roundCount, progressCount] = await Promise.all([
    prisma.roundGoal.count({ where: { id: { in: roundIds }, ownerId: userId } }),
    prisma.progressGoal.count({ where: { id: { in: progressIds }, ownerId: userId } })
  ]);
  return roundCount === roundIds.length && progressCount === progressIds.length
    ? null
    : "リンクする数量目標または進捗目標が見つかりません";
}

router.get("/", async (req, res, next) => {
  try {
    const scope = req.query.scope === "crew" ? "crew" : "personal";
    const goals = await prisma.goal.findMany({
      where: scope === "crew" ? { visibility: "crew" } : { visibility: "personal", ownerId: ownerId(req) },
      include: goalInclude,
      orderBy: [{ boardStatus: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    res.json({ goals: goals.map(serializeGoal) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: accessibleWhere(req.params.id, ownerId(req)),
      include: goalInclude
    });
    if (!goal) return res.status(404).json({ message: "目標が見つかりません" });
    res.json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = text(req.body.title);
    const rawSubTasks = req.body.subTasks === undefined ? [] : req.body.subTasks;
    if (!title) return res.status(400).json({ message: "タイトルを入力してください" });
    if (!Array.isArray(rawSubTasks) || rawSubTasks.length > MAX_SUB_TASKS) {
      return res.status(400).json({ message: `サブタスクは${MAX_SUB_TASKS}件まで追加できます` });
    }
    const subTasks = rawSubTasks.map(parseSubTaskInput);
    if (subTasks.some((item) => !item)) return res.status(400).json({ message: "サブタスクの入力を確認してください" });
    const userId = ownerId(req);
    const validationError = await validateSubTaskInputs(subTasks as SubTaskInput[], userId, "personal");
    if (validationError) return res.status(400).json({ message: validationError });
    const goal = await prisma.goal.create({
      data: {
        title,
        description: optionalText(req.body.description),
        memo: optionalText(req.body.memo),
        visibility: "personal",
        boardStatus: "unset",
        ownerId: userId,
        subTasks: {
          create: (subTasks as SubTaskInput[]).map((item, sortOrder) => ({ ...item, sortOrder }))
        }
      },
      include: goalInclude
    });
    res.status(201).json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: accessibleWhere(req.params.id, ownerId(req)) });
    if (!existing || !canEdit(existing, ownerId(req))) return res.status(404).json({ message: "目標が見つかりません" });
    const requestedVisibility = text(req.body.visibility) || existing.visibility;
    if (!visibilities.has(requestedVisibility)) return res.status(400).json({ message: "公開範囲が不正です" });
    if (existing.visibility === "crew" && requestedVisibility === "personal") {
      return res.status(400).json({ message: "団内目標を個人目標へ戻すことはできません" });
    }
    if (requestedVisibility !== existing.visibility && existing.ownerId !== ownerId(req)) {
      return res.status(403).json({ message: "公開範囲を変更できるのは作成者だけです" });
    }
    if (existing.visibility === "personal" && requestedVisibility === "crew") {
      if (req.body.confirmCrewPublish !== true) return res.status(400).json({ message: "団内公開の確認が必要です" });
      const linkedCount = await prisma.goalSubTask.count({
        where: { goalId: existing.id, kind: { in: ["round", "progress"] } }
      });
      if (linkedCount) return res.status(400).json({ message: "数量目標・進捗目標のリンクを解除してから公開してください" });
    }
    const requestedStatus = text(req.body.boardStatus) || existing.boardStatus;
    if (!boardStatuses.has(requestedStatus)) return res.status(400).json({ message: "目標の状態が不正です" });
    const title = req.body.title === undefined ? existing.title : text(req.body.title);
    if (!title) return res.status(400).json({ message: "タイトルを入力してください" });
    const expectedUpdatedAt = date(req.body.expectedUpdatedAt);
    if (!expectedUpdatedAt) return res.status(400).json({ message: "最新の更新日時が必要です" });
    const updated = await prisma.goal.updateMany({
      where: { id: existing.id, updatedAt: expectedUpdatedAt },
      data: {
        title,
        description: req.body.description === undefined ? existing.description : optionalText(req.body.description),
        memo: req.body.memo === undefined ? existing.memo : optionalText(req.body.memo),
        visibility: requestedVisibility,
        boardStatus: requestedStatus
      }
    });
    if (!updated.count) return res.status(409).json({ message: "他のメンバーが更新しました。最新の内容を読み込んでください" });
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: existing.id }, include: goalInclude });
    res.json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/source-link", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, ownerId: ownerId(req) },
      select: { id: true, sourceRoundGoalId: true, sourceProgressGoalId: true }
    });
    if (!existing || (!existing.sourceRoundGoalId && !existing.sourceProgressGoalId)) {
      return res.status(404).json({ message: "連携目標が見つかりません" });
    }
    await prisma.goal.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.goal.deleteMany({ where: { id: req.params.id, ownerId: ownerId(req) } });
    if (!deleted.count) return res.status(404).json({ message: "目標が見つかりません" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sub-tasks", async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: accessibleWhere(req.params.id, ownerId(req)) });
    if (!goal || !canEdit(goal, ownerId(req))) return res.status(404).json({ message: "目標が見つかりません" });
    const input = parseSubTaskInput(req.body);
    if (!input) return res.status(400).json({ message: "サブタスクの入力を確認してください" });
    const count = await prisma.goalSubTask.count({ where: { goalId: goal.id } });
    if (count >= MAX_SUB_TASKS) return res.status(400).json({ message: `サブタスクは${MAX_SUB_TASKS}件まで追加できます` });
    const validationError = await validateSubTaskInputs([input], ownerId(req), goal.visibility);
    if (validationError) return res.status(400).json({ message: validationError });
    const expectedUpdatedAt = date(req.body.expectedGoalUpdatedAt);
    if (!expectedUpdatedAt) return res.status(400).json({ message: "最新の更新日時が必要です" });
    const item = await prisma.$transaction(async (transaction) => {
      const changed = await transaction.goal.updateMany({
        where: { id: goal.id, updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() }
      });
      if (!changed.count) return null;
      return transaction.goalSubTask.create({ data: { ...input, goalId: goal.id, sortOrder: count } });
    });
    if (!item) return res.status(409).json({ message: "他のメンバーが更新しました。最新の内容を読み込んでください" });
    const refreshed = await prisma.goal.findUniqueOrThrow({ where: { id: goal.id }, include: goalInclude });
    res.status(201).json({ goal: serializeGoal(refreshed) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/sub-tasks/:subTaskId", async (req, res, next) => {
  try {
    const item = await prisma.goalSubTask.findFirst({
      where: { id: req.params.subTaskId, goalId: req.params.id },
      include: { goal: true }
    });
    if (!item || !canEdit(item.goal, ownerId(req))) return res.status(404).json({ message: "サブタスクが見つかりません" });
    const expectedUpdatedAt = date(req.body.expectedUpdatedAt);
    if (!expectedUpdatedAt) return res.status(400).json({ message: "最新の更新日時が必要です" });
    const data: Prisma.GoalSubTaskUpdateManyMutationInput = {};
    if (item.kind === "standard") {
      if (req.body.title !== undefined) {
        const title = text(req.body.title);
        if (!title || title.length > MAX_SUB_TASK_TITLE) return res.status(400).json({ message: "タイトルは100文字以内で入力してください" });
        data.title = title;
      }
      if (typeof req.body.isDone === "boolean") data.isDone = req.body.isDone;
    } else if (req.body.completionOverride === null || typeof req.body.completionOverride === "boolean") {
      data.completionOverride = req.body.completionOverride;
    } else {
      return res.status(400).json({ message: "完了状態を確認してください" });
    }
    const updated = await prisma.goalSubTask.updateMany({
      where: { id: item.id, updatedAt: expectedUpdatedAt },
      data
    });
    if (!updated.count) return res.status(409).json({ message: "他のメンバーが更新しました。最新の内容を読み込んでください" });
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: item.goalId }, include: goalInclude });
    res.json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/sub-tasks/order", async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: accessibleWhere(req.params.id, ownerId(req)) });
    if (!goal || !canEdit(goal, ownerId(req))) return res.status(404).json({ message: "目標が見つかりません" });
    const subTaskIds = Array.isArray(req.body.subTaskIds) && req.body.subTaskIds.every((id: unknown) => typeof id === "string")
      ? req.body.subTaskIds as string[]
      : [];
    const existingIds = await prisma.goalSubTask.findMany({ where: { goalId: goal.id }, select: { id: true } });
    if (subTaskIds.length !== existingIds.length || new Set(subTaskIds).size !== subTaskIds.length ||
      existingIds.some((item) => !subTaskIds.includes(item.id))) {
      return res.status(400).json({ message: "並び順を更新できません" });
    }
    const expectedUpdatedAt = date(req.body.expectedGoalUpdatedAt);
    if (!expectedUpdatedAt) return res.status(400).json({ message: "最新の更新日時が必要です" });
    const changed = await prisma.$transaction(async (transaction) => {
      const result = await transaction.goal.updateMany({
        where: { id: goal.id, updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() }
      });
      if (!result.count) return false;
      await Promise.all(subTaskIds.map((id, sortOrder) => transaction.goalSubTask.update({ where: { id }, data: { sortOrder } })));
      return true;
    });
    if (!changed) return res.status(409).json({ message: "他のメンバーが更新しました。最新の内容を読み込んでください" });
    const refreshed = await prisma.goal.findUniqueOrThrow({ where: { id: goal.id }, include: goalInclude });
    res.json({ goal: serializeGoal(refreshed) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/sub-tasks/:subTaskId", async (req, res, next) => {
  try {
    const item = await prisma.goalSubTask.findFirst({
      where: { id: req.params.subTaskId, goalId: req.params.id },
      include: { goal: true }
    });
    if (!item || !canEdit(item.goal, ownerId(req))) return res.status(404).json({ message: "サブタスクが見つかりません" });
    const expectedGoalUpdatedAt = date(req.body?.expectedGoalUpdatedAt ?? req.query.expectedGoalUpdatedAt);
    if (!expectedGoalUpdatedAt) return res.status(400).json({ message: "最新の更新日時が必要です" });
    const deleted = await prisma.$transaction(async (transaction) => {
      const changed = await transaction.goal.updateMany({
        where: { id: item.goalId, updatedAt: expectedGoalUpdatedAt },
        data: { updatedAt: new Date() }
      });
      if (!changed.count) return false;
      await transaction.goalSubTask.delete({ where: { id: item.id } });
      return true;
    });
    if (!deleted) return res.status(409).json({ message: "他のメンバーが更新しました。最新の内容を読み込んでください" });
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: item.goalId }, include: goalInclude });
    res.json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

export { router as goalsRouter };
