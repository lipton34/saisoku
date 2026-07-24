import { Router, type Request } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();
router.use(requireAuth);

const boardStatuses = new Set(["unset", "now", "later"]);
const visibilities = new Set(["personal", "crew"]);

function ownerId(req: Request) {
  return req.user?.id ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return text(value) || null;
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
  requiredItems: { orderBy: { createdAt: "asc" as const } },
  raidTargets: { orderBy: { createdAt: "asc" as const } },
  subTasks: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] }
};

function accessibleWhere(id: string, userId: string) {
  return { id, OR: [{ ownerId: userId }, { visibility: "crew" }] };
}

router.get("/", async (req, res, next) => {
  try {
    const scope = req.query.scope === "crew" ? "crew" : "personal";
    const goals = await prisma.goal.findMany({
      where: scope === "crew" ? { visibility: "crew" } : { visibility: "personal", ownerId: ownerId(req) },
      include: goalInclude,
      orderBy: [{ boardStatus: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    res.json({ goals });
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
    if (!goal) {
      res.status(404).json({ message: "目標が見つかりません" });
      return;
    }
    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = text(req.body.title);
    if (!title) {
      res.status(400).json({ message: "タイトルを入力してください" });
      return;
    }
    const goal = await prisma.goal.create({
      data: {
        title,
        description: optionalText(req.body.description),
        memo: optionalText(req.body.memo),
        visibility: "personal",
        boardStatus: "unset",
        ownerId: ownerId(req)
      },
      include: goalInclude
    });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, ownerId: ownerId(req) }
    });
    if (!existing) {
      res.status(404).json({ message: "目標が見つかりません" });
      return;
    }

    const requestedVisibility = text(req.body.visibility) || existing.visibility;
    if (!visibilities.has(requestedVisibility)) {
      res.status(400).json({ message: "公開範囲が不正です" });
      return;
    }
    if (existing.visibility === "crew" && requestedVisibility === "personal") {
      res.status(400).json({ message: "団内目標を個人目標へ戻すことはできません" });
      return;
    }
    if (existing.visibility === "personal" && requestedVisibility === "crew" && req.body.confirmCrewPublish !== true) {
      res.status(400).json({ message: "団内公開の確認が必要です" });
      return;
    }

    const requestedStatus = text(req.body.boardStatus) || existing.boardStatus;
    if (!boardStatuses.has(requestedStatus)) {
      res.status(400).json({ message: "目標の状態が不正です" });
      return;
    }
    const title = req.body.title === undefined ? existing.title : text(req.body.title);
    if (!title) {
      res.status(400).json({ message: "タイトルを入力してください" });
      return;
    }

    const goal = await prisma.goal.update({
      where: { id: existing.id },
      data: {
        title,
        description: req.body.description === undefined ? existing.description : optionalText(req.body.description),
        memo: req.body.memo === undefined ? existing.memo : optionalText(req.body.memo),
        visibility: requestedVisibility,
        boardStatus: requestedStatus
      },
      include: goalInclude
    });
    res.json({ goal });
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
      res.status(404).json({ message: "連携目標が見つかりません" });
      return;
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
    if (deleted.count === 0) {
      res.status(404).json({ message: "目標が見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sub-tasks", async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, ownerId: ownerId(req) } });
    const title = text(req.body.title);
    if (!goal || !title) {
      res.status(400).json({ message: "目標とサブタスク名を確認してください" });
      return;
    }
    const count = await prisma.goalSubTask.count({ where: { goalId: goal.id } });
    const subTask = await prisma.goalSubTask.create({
      data: { goalId: goal.id, title, sortOrder: count }
    });
    res.status(201).json({ subTask });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/sub-tasks/:subTaskId", async (req, res, next) => {
  try {
    const subTask = await prisma.goalSubTask.findFirst({
      where: { id: req.params.subTaskId, goalId: req.params.id, goal: { ownerId: ownerId(req) } }
    });
    if (!subTask) {
      res.status(404).json({ message: "サブタスクが見つかりません" });
      return;
    }
    const updated = await prisma.goalSubTask.update({
      where: { id: subTask.id },
      data: {
        title: req.body.title === undefined ? subTask.title : text(req.body.title) || subTask.title,
        isDone: typeof req.body.isDone === "boolean" ? req.body.isDone : subTask.isDone
      }
    });
    res.json({ subTask: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/sub-tasks/:subTaskId", async (req, res, next) => {
  try {
    const deleted = await prisma.goalSubTask.deleteMany({
      where: { id: req.params.subTaskId, goalId: req.params.id, goal: { ownerId: ownerId(req) } }
    });
    if (deleted.count === 0) {
      res.status(404).json({ message: "サブタスクが見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as goalsRouter };
