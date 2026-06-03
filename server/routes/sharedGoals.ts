import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

const goalCategories = ["周回", "編成", "その他"] as const;
const goalStatuses = ["達成", "未達成"] as const;
const goalBoardStatuses = ["now", "next", "later", "paused", "done"] as const;
const goalPriorities = ["high", "medium", "low"] as const;
const goalEfforts = ["light", "normal", "heavy"] as const;
const proposalStatuses = ["提案中", "受け入れ済み", "見送り"] as const;

type GoalCategory = (typeof goalCategories)[number];
type GoalStatus = (typeof goalStatuses)[number];
type GoalBoardStatus = (typeof goalBoardStatuses)[number];
type GoalPriority = (typeof goalPriorities)[number];
type GoalEffort = (typeof goalEfforts)[number];
type ProposalStatus = (typeof proposalStatuses)[number];

type FormationPart = {
  kind: "character" | "weapon" | "summon";
  name: string;
  masterId?: string | null;
  owned: boolean;
  position?: string;
};

type GoalDetails = {
  itemName?: string | null;
  questName?: string | null;
  questUrl?: string | null;
  content?: string | null;
  sourceBuildPostId?: string | null;
  sourceBuildPostTitle?: string | null;
  characters?: FormationPart[];
  weapons?: FormationPart[];
  summons?: FormationPart[];
};

function currentUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return req.user?.id ?? "";
}

function parseText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalText(value: unknown) {
  const text = parseText(value);
  return text.length > 0 ? text : null;
}

function parseCategory(value: unknown): GoalCategory {
  return goalCategories.includes(value as GoalCategory) ? (value as GoalCategory) : "その他";
}

function parseGoalStatus(value: unknown, category: GoalCategory, fallback?: string): GoalStatus {
  return goalStatuses.includes(value as GoalStatus)
    ? (value as GoalStatus)
    : fallback === "達成"
      ? "達成"
      : "未達成";
}

function parseBoardStatus(value: unknown, fallback?: string): GoalBoardStatus {
  return goalBoardStatuses.includes(value as GoalBoardStatus)
    ? (value as GoalBoardStatus)
    : goalBoardStatuses.includes(fallback as GoalBoardStatus)
      ? (fallback as GoalBoardStatus)
      : "later";
}

function parsePriority(value: unknown, fallback?: string): GoalPriority {
  return goalPriorities.includes(value as GoalPriority)
    ? (value as GoalPriority)
    : goalPriorities.includes(fallback as GoalPriority)
      ? (fallback as GoalPriority)
      : "medium";
}

function parseEffort(value: unknown, fallback?: string): GoalEffort {
  return goalEfforts.includes(value as GoalEffort)
    ? (value as GoalEffort)
    : goalEfforts.includes(fallback as GoalEffort)
      ? (fallback as GoalEffort)
      : "normal";
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true";
  }
  return fallback;
}

function parseInteger(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : fallback;
}

function parseCount(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function parseProposalStatus(value: unknown): ProposalStatus | null {
  return proposalStatuses.includes(value as ProposalStatus) ? (value as ProposalStatus) : null;
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function progressRate(targetValue: number | null, currentValue: number | null) {
  if (targetValue === null || currentValue === null || targetValue <= 0) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 1000) / 10));
}

function parsePart(value: unknown, kind: FormationPart["kind"]): FormationPart | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = parseText(record.name);
  if (!name) {
    return null;
  }

  return {
    kind,
    name,
    masterId: parseOptionalText(record.masterId),
    owned: Boolean(record.owned),
    position: parseOptionalText(record.position) ?? undefined
  };
}

function parseParts(value: unknown, kind: FormationPart["kind"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => parsePart(item, kind)).filter((item): item is FormationPart => Boolean(item));
}

function parseDetails(value: unknown, category: GoalCategory): GoalDetails {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  if (category === "周回") {
    return {
      itemName: parseOptionalText(record.itemName),
      questName: parseOptionalText(record.questName),
      questUrl: parseOptionalText(record.questUrl)
    };
  }

  if (category === "編成") {
    return {
      sourceBuildPostId: parseOptionalText(record.sourceBuildPostId),
      sourceBuildPostTitle: parseOptionalText(record.sourceBuildPostTitle),
      characters: parseParts(record.characters, "character"),
      weapons: parseParts(record.weapons, "weapon"),
      summons: parseParts(record.summons, "summon")
    };
  }

  return {
    content: parseOptionalText(record.content)
  };
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  if (value && typeof value === "object") {
    return value as Prisma.InputJsonObject;
  }

  return {};
}

function goalDataFromBody(
  body: Record<string, unknown>,
  fallback?: {
    category: string;
    status: string;
    boardStatus?: string;
    priority?: string;
    effort?: string;
    beginnerRecommended?: boolean;
    sortOrder?: number;
  }
) {
  const category = "category" in body ? parseCategory(body.category) : parseCategory(fallback?.category);
  const details = parseDetails(body.details, category);
  const title = parseText(body.title);
  const targetValue =
    category === "周回"
      ? parseOptionalNumber(body.targetValue ?? (body.details as Record<string, unknown> | undefined)?.requiredCount)
      : null;
  const currentValue =
    category === "周回"
      ? parseOptionalNumber(body.currentValue ?? (body.details as Record<string, unknown> | undefined)?.currentCount)
      : null;

  return {
    title,
    category,
    description:
      category === "その他" ? details.content ?? parseOptionalText(body.description) : parseOptionalText(body.description),
    targetValue,
    currentValue,
    unit: null,
    details: {
      ...details,
      ...(category === "周回" ? { requiredCount: targetValue, currentCount: currentValue } : {})
    },
    progressRate: category === "周回" ? progressRate(targetValue, currentValue) : null,
    status: parseGoalStatus(body.status, category, fallback?.status),
    boardStatus: parseBoardStatus(body.boardStatus, fallback?.boardStatus),
    priority: parsePriority(body.priority, fallback?.priority),
    effort: parseEffort(body.effort, fallback?.effort),
    beginnerRecommended: parseBoolean(body.beginnerRecommended, fallback?.beginnerRecommended ?? false),
    sortOrder: parseInteger(body.sortOrder, fallback?.sortOrder ?? 0),
    dueDate: "dueDate" in body ? parseDate(body.dueDate) : undefined,
    memo: "memo" in body ? parseOptionalText(body.memo) : undefined
  };
}

const userSelect = {
  id: true,
  username: true,
  displayName: true
};

const goalInclude: Prisma.SharedGoalInclude = {
  owner: { select: userSelect },
  proposedByUser: { select: userSelect },
  buildLinks: {
    include: {
      build: {
        select: {
          id: true,
          title: true,
          category: true,
          questName: true,
          element: true,
          purpose: true,
          operationType: true,
          verificationStatus: true,
          ownerId: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  },
  requiredItems: {
    include: { masterItem: true },
    orderBy: { createdAt: "asc" }
  },
  raidTargets: { orderBy: { createdAt: "asc" } },
  subTasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }
};

const proposalInclude: Prisma.GoalProposalInclude = {
  proposer: { select: userSelect },
  targetUser: { select: userSelect }
};

async function findOwnedGoal(goalId: string, ownerId: string) {
  return prisma.sharedGoal.findFirst({
    where: { id: goalId, ownerId },
    select: { id: true }
  });
}

router.get("/members", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: [{ displayName: "asc" }, { username: "asc" }]
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const due = typeof req.query.due === "string" ? req.query.due : "";
    const priority = typeof req.query.priority === "string" ? req.query.priority : "";
    const effort = typeof req.query.effort === "string" ? req.query.effort : "";
    const beginnerOnly = req.query.beginnerOnly === "true";
    const boardStatus = typeof req.query.boardStatus === "string" ? req.query.boardStatus : "";
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const now = new Date();

    const goals = await prisma.sharedGoal.findMany({
      where: {
        ...(userId ? { ownerId: userId } : {}),
        ...(goalCategories.includes(category as GoalCategory) ? { category } : {}),
        ...(goalStatuses.includes(status as GoalStatus) ? { status } : {}),
        ...(goalBoardStatuses.includes(boardStatus as GoalBoardStatus) ? { boardStatus } : {}),
        ...(goalPriorities.includes(priority as GoalPriority) ? { priority } : {}),
        ...(goalEfforts.includes(effort as GoalEffort) ? { effort } : {}),
        ...(beginnerOnly ? { beginnerRecommended: true } : {}),
        ...(due === "overdue" ? { dueDate: { lt: now }, status: { not: "達成" } } : {}),
        ...(due === "upcoming" ? { dueDate: { gte: now } } : {}),
        ...(due === "none" ? { dueDate: null } : {}),
      },
      include: goalInclude,
      orderBy: [{ boardStatus: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }, { createdAt: "desc" }]
    });

    const normalizedKeyword = keyword.toLowerCase();
    const filteredGoals = keyword
      ? goals.filter((goal) =>
          [
            goal.title,
            goal.description,
            goal.memo,
            goal.owner.displayName,
            goal.owner.username,
            JSON.stringify(goal.details)
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
        )
      : goals;

    res.json({ goals: filteredGoals });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: req.params.id },
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
    const parsed = goalDataFromBody(req.body);
    if (!parsed.title) {
      res.status(400).json({ message: "目標タイトルを入力してください" });
      return;
    }

    const goal = await prisma.sharedGoal.create({
      data: {
        title: parsed.title,
        category: parsed.category,
        description: parsed.description,
        targetValue: parsed.targetValue,
        currentValue: parsed.currentValue,
        unit: null,
        details: parsed.details,
        progressRate: parsed.progressRate,
        status: parsed.status,
        boardStatus: parsed.boardStatus,
        priority: parsed.priority,
        effort: parsed.effort,
        dueDate: parsed.dueDate ?? null,
        beginnerRecommended: parsed.beginnerRecommended,
        sortOrder: parsed.sortOrder,
        memo: parsed.memo ?? null,
        ownerId: currentUserId(req)
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
    const existing = await prisma.sharedGoal.findFirst({
      where: { id: req.params.id, ownerId: currentUserId(req) }
    });

    if (!existing) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }

    const parsed = goalDataFromBody(req.body, {
      category: existing.category,
      status: existing.status,
      boardStatus: existing.boardStatus,
      priority: existing.priority,
      effort: existing.effort,
      beginnerRecommended: existing.beginnerRecommended,
      sortOrder: existing.sortOrder
    });
    const title = "title" in req.body ? parsed.title : existing.title;
    if (!title) {
      res.status(400).json({ message: "目標タイトルを入力してください" });
      return;
    }

    const category = "category" in req.body ? parsed.category : parseCategory(existing.category);
    const targetValue =
      "targetValue" in req.body || "details" in req.body ? parsed.targetValue : existing.targetValue;
    const currentValue =
      "currentValue" in req.body || "details" in req.body ? parsed.currentValue : existing.currentValue;

    const goal = await prisma.sharedGoal.update({
      where: { id: existing.id },
      data: {
        title,
        category,
        description:
          "description" in req.body || "details" in req.body ? parsed.description : existing.description,
        targetValue,
        currentValue,
        unit: null,
        details: "details" in req.body ? parsed.details : inputJson(existing.details),
        progressRate: category === "周回" ? progressRate(targetValue, currentValue) : null,
        status: "status" in req.body ? parseGoalStatus(req.body.status, category, existing.status) : existing.status,
        boardStatus: "boardStatus" in req.body ? parsed.boardStatus : existing.boardStatus,
        priority: "priority" in req.body ? parsed.priority : existing.priority,
        effort: "effort" in req.body ? parsed.effort : existing.effort,
        dueDate: "dueDate" in req.body ? parsed.dueDate ?? null : existing.dueDate,
        beginnerRecommended:
          "beginnerRecommended" in req.body ? parsed.beginnerRecommended : existing.beginnerRecommended,
        sortOrder: "sortOrder" in req.body ? parsed.sortOrder : existing.sortOrder,
        memo: "memo" in req.body ? parsed.memo ?? null : existing.memo
      },
      include: goalInclude
    });

    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.sharedGoal.findFirst({
      where: { id: req.params.id, ownerId: currentUserId(req) },
      select: { id: true }
    });

    if (!existing) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }

    await prisma.sharedGoal.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/build-links", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    const buildId = parseText(req.body.buildId);
    if (!goal || !buildId) {
      res.status(400).json({ message: "目標と編成を選択してください" });
      return;
    }

    const build = await prisma.buildPost.findUnique({ where: { id: buildId }, select: { id: true } });
    if (!build) {
      res.status(404).json({ message: "編成が見つかりません" });
      return;
    }

    const link = await prisma.goalBuildLink.upsert({
      where: { goalId_buildId: { goalId: goal.id, buildId } },
      update: { note: parseOptionalText(req.body.note) },
      create: { goalId: goal.id, buildId, note: parseOptionalText(req.body.note) },
      include: { build: true }
    });

    res.status(201).json({ link });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/build-links/:linkId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }

    const updated = await prisma.goalBuildLink.updateMany({
      where: { id: req.params.linkId, goalId: goal.id },
      data: { note: parseOptionalText(req.body.note) }
    });
    if (updated.count === 0) {
      res.status(404).json({ message: "関連編成が見つかりません" });
      return;
    }
    const link = await prisma.goalBuildLink.findUnique({ where: { id: req.params.linkId }, include: { build: true } });
    res.json({ link });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/build-links/:linkId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const deleted = await prisma.goalBuildLink.deleteMany({ where: { id: req.params.linkId, goalId: goal.id } });
    if (deleted.count === 0) {
      res.status(404).json({ message: "関連編成が見つかりません" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/required-items", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    const name = parseText(req.body.name);
    if (!goal || !name) {
      res.status(400).json({ message: "目標と必要武器名を入力してください" });
      return;
    }

    const item = await prisma.goalRequiredItem.create({
      data: {
        goalId: goal.id,
        masterItemId: parseOptionalText(req.body.masterItemId),
        itemKind: parseOptionalText(req.body.itemKind) ?? "weapon",
        name,
        requiredCount: parseCount(req.body.requiredCount, 1),
        currentCount: parseCount(req.body.currentCount, 0),
        importance: parseOptionalText(req.body.importance) ?? "必須",
        note: parseOptionalText(req.body.note)
      },
      include: { masterItem: true }
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/required-items/:itemId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const name = "name" in req.body ? parseText(req.body.name) : undefined;
    if (name !== undefined && !name) {
      res.status(400).json({ message: "必要武器名を入力してください" });
      return;
    }

    const updated = await prisma.goalRequiredItem.updateMany({
      where: { id: req.params.itemId, goalId: goal.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...("masterItemId" in req.body ? { masterItemId: parseOptionalText(req.body.masterItemId) } : {}),
        ...("itemKind" in req.body ? { itemKind: parseOptionalText(req.body.itemKind) ?? "weapon" } : {}),
        ...("requiredCount" in req.body ? { requiredCount: parseCount(req.body.requiredCount, 1) } : {}),
        ...("currentCount" in req.body ? { currentCount: parseCount(req.body.currentCount, 0) } : {}),
        ...("importance" in req.body ? { importance: parseOptionalText(req.body.importance) ?? "必須" } : {}),
        ...("note" in req.body ? { note: parseOptionalText(req.body.note) } : {})
      }
    });
    if (updated.count === 0) {
      res.status(404).json({ message: "必要武器が見つかりません" });
      return;
    }
    const item = await prisma.goalRequiredItem.findUnique({ where: { id: req.params.itemId }, include: { masterItem: true } });
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/required-items/:itemId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const deleted = await prisma.goalRequiredItem.deleteMany({ where: { id: req.params.itemId, goalId: goal.id } });
    if (deleted.count === 0) {
      res.status(404).json({ message: "必要武器が見つかりません" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/raid-targets", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    const questName = parseText(req.body.questName);
    if (!goal || !questName) {
      res.status(400).json({ message: "目標とクエスト名を入力してください" });
      return;
    }
    const target = await prisma.goalRaidTarget.create({
      data: {
        goalId: goal.id,
        questName,
        runType: parseOptionalText(req.body.runType) ?? "other",
        targetCount: parseCount(req.body.targetCount, 0),
        currentCount: parseCount(req.body.currentCount, 0),
        note: parseOptionalText(req.body.note)
      }
    });
    res.status(201).json({ target });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/raid-targets/:targetId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const questName = "questName" in req.body ? parseText(req.body.questName) : undefined;
    if (questName !== undefined && !questName) {
      res.status(400).json({ message: "クエスト名を入力してください" });
      return;
    }
    const updated = await prisma.goalRaidTarget.updateMany({
      where: { id: req.params.targetId, goalId: goal.id },
      data: {
        ...(questName !== undefined ? { questName } : {}),
        ...("runType" in req.body ? { runType: parseOptionalText(req.body.runType) ?? "other" } : {}),
        ...("targetCount" in req.body ? { targetCount: parseCount(req.body.targetCount, 0) } : {}),
        ...("currentCount" in req.body ? { currentCount: parseCount(req.body.currentCount, 0) } : {}),
        ...("note" in req.body ? { note: parseOptionalText(req.body.note) } : {})
      }
    });
    if (updated.count === 0) {
      res.status(404).json({ message: "討伐目標が見つかりません" });
      return;
    }
    const target = await prisma.goalRaidTarget.findUnique({ where: { id: req.params.targetId } });
    res.json({ target });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/raid-targets/:targetId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const deleted = await prisma.goalRaidTarget.deleteMany({ where: { id: req.params.targetId, goalId: goal.id } });
    if (deleted.count === 0) {
      res.status(404).json({ message: "討伐目標が見つかりません" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sub-tasks", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    const title = parseText(req.body.title);
    if (!goal || !title) {
      res.status(400).json({ message: "目標とサブタスク名を入力してください" });
      return;
    }
    const task = await prisma.goalSubTask.create({
      data: {
        goalId: goal.id,
        title,
        isDone: parseBoolean(req.body.isDone, false),
        sortOrder: parseInteger(req.body.sortOrder, 0)
      }
    });
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/sub-tasks/:taskId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const title = "title" in req.body ? parseText(req.body.title) : undefined;
    if (title !== undefined && !title) {
      res.status(400).json({ message: "サブタスク名を入力してください" });
      return;
    }
    const updated = await prisma.goalSubTask.updateMany({
      where: { id: req.params.taskId, goalId: goal.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...("isDone" in req.body ? { isDone: parseBoolean(req.body.isDone, false) } : {}),
        ...("sortOrder" in req.body ? { sortOrder: parseInteger(req.body.sortOrder, 0) } : {})
      }
    });
    if (updated.count === 0) {
      res.status(404).json({ message: "サブタスクが見つかりません" });
      return;
    }
    const task = await prisma.goalSubTask.findUnique({ where: { id: req.params.taskId } });
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/sub-tasks/:taskId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "自分の目標が見つかりません" });
      return;
    }
    const deleted = await prisma.goalSubTask.deleteMany({ where: { id: req.params.taskId, goalId: goal.id } });
    if (deleted.count === 0) {
      res.status(404).json({ message: "サブタスクが見つかりません" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/proposals/inbox/list", async (req, res, next) => {
  try {
    const status = parseProposalStatus(req.query.status);
    const proposals = await prisma.goalProposal.findMany({
      where: {
        targetUserId: currentUserId(req),
        ...(status ? { status } : {})
      },
      include: proposalInclude,
      orderBy: { updatedAt: "desc" }
    });

    res.json({ proposals });
  } catch (error) {
    next(error);
  }
});

router.post("/proposals", async (req, res, next) => {
  try {
    const targetUserIds: string[] = Array.isArray(req.body.targetUserIds)
      ? req.body.targetUserIds
          .map((value: unknown) => parseText(value))
          .filter((value: string): value is string => Boolean(value))
      : [parseText(req.body.targetUserId)].filter(Boolean);
    const uniqueTargetUserIds: string[] = [...new Set(targetUserIds)];
    const parsed = goalDataFromBody(req.body);

    if (!parsed.title || uniqueTargetUserIds.length === 0) {
      res.status(400).json({ message: "提案先と目標タイトルを入力してください" });
      return;
    }

    if (uniqueTargetUserIds.includes(currentUserId(req))) {
      res.status(400).json({ message: "自分以外の団員を選んでください" });
      return;
    }

    const targetUsers = await prisma.user.findMany({
      where: { id: { in: uniqueTargetUserIds } },
      select: { id: true }
    });
    if (targetUsers.length !== uniqueTargetUserIds.length) {
      res.status(404).json({ message: "提案先の団員が見つかりません" });
      return;
    }

    const proposals = await prisma.$transaction(
      uniqueTargetUserIds.map((targetUserId) =>
        prisma.goalProposal.create({
          data: {
            proposerUserId: currentUserId(req),
            targetUserId,
            title: parsed.title,
            category: parsed.category,
            description: parsed.description,
            targetValue: parsed.targetValue,
            unit: null,
            details: parsed.details,
            dueDate: parsed.dueDate ?? null,
            proposalMemo: parseOptionalText(req.body.proposalMemo)
          },
          include: proposalInclude
        })
      )
    );

    res.status(201).json({ proposal: proposals[0], proposals });
  } catch (error) {
    next(error);
  }
});

router.post("/proposals/:id/accept", async (req, res, next) => {
  try {
    const existing = await prisma.goalProposal.findFirst({
      where: { id: req.params.id, targetUserId: currentUserId(req) }
    });

    if (!existing) {
      res.status(404).json({ message: "提案が見つかりません" });
      return;
    }

    if (existing.status !== "提案中") {
      res.status(400).json({ message: "この提案はすでに処理済みです" });
      return;
    }

    const category = parseCategory(existing.category);
    const result = await prisma.$transaction(async (tx) => {
      const targetValue = category === "周回" ? existing.targetValue : null;
      const currentValue = category === "周回" ? 0 : null;
      const goal = await tx.sharedGoal.create({
        data: {
          title: existing.title,
          category,
          description: existing.description,
          targetValue,
          currentValue,
          unit: null,
          details:
            category === "周回" && existing.details && typeof existing.details === "object"
              ? { ...(existing.details as Record<string, unknown>), currentCount: 0 }
              : inputJson(existing.details),
          progressRate: category === "周回" ? progressRate(targetValue, currentValue) : null,
          status: "未達成",
          boardStatus: "later",
          priority: "medium",
          effort: "normal",
          dueDate: existing.dueDate,
          beginnerRecommended: false,
          sortOrder: 0,
          memo: existing.proposalMemo,
          sourceProposalId: existing.id,
          proposedByUserId: existing.proposerUserId,
          ownerId: currentUserId(req)
        },
        include: goalInclude
      });

      const proposal = await tx.goalProposal.update({
        where: { id: existing.id },
        data: { status: "受け入れ済み", acceptedGoalId: goal.id },
        include: proposalInclude
      });

      return { goal, proposal };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/proposals/:id/decline", async (req, res, next) => {
  try {
    const existing = await prisma.goalProposal.findFirst({
      where: { id: req.params.id, targetUserId: currentUserId(req) }
    });

    if (!existing) {
      res.status(404).json({ message: "提案が見つかりません" });
      return;
    }

    if (existing.status !== "提案中") {
      res.status(400).json({ message: "この提案はすでに処理済みです" });
      return;
    }

    const proposal = await prisma.goalProposal.update({
      where: { id: existing.id },
      data: { status: "見送り" },
      include: proposalInclude
    });

    res.json({ proposal });
  } catch (error) {
    next(error);
  }
});

export { router as sharedGoalsRouter };
