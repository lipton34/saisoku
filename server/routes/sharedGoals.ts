import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

const goalCategories = ["古戦場", "高難度", "周回", "育成", "その他"] as const;
const goalStatuses = ["未着手", "進行中", "達成", "中止"] as const;
const proposalStatuses = ["提案中", "受け入れ済み", "見送り"] as const;

type GoalCategory = (typeof goalCategories)[number];
type GoalStatus = (typeof goalStatuses)[number];
type ProposalStatus = (typeof proposalStatuses)[number];

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

function parseGoalStatus(value: unknown, fallback: GoalStatus = "未着手"): GoalStatus {
  return goalStatuses.includes(value as GoalStatus) ? (value as GoalStatus) : fallback;
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

const userSelect = {
  id: true,
  username: true,
  displayName: true
};

const goalInclude = {
  owner: { select: userSelect },
  proposedByUser: { select: userSelect }
};

const proposalInclude = {
  proposer: { select: userSelect },
  targetUser: { select: userSelect }
};

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
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const now = new Date();

    const goals = await prisma.sharedGoal.findMany({
      where: {
        ...(userId ? { ownerId: userId } : {}),
        ...(goalCategories.includes(category as GoalCategory) ? { category } : {}),
        ...(goalStatuses.includes(status as GoalStatus) ? { status } : {}),
        ...(due === "overdue" ? { dueDate: { lt: now }, status: { notIn: ["達成", "中止"] } } : {}),
        ...(due === "upcoming" ? { dueDate: { gte: now } } : {}),
        ...(due === "none" ? { dueDate: null } : {}),
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword, mode: "insensitive" } },
                { description: { contains: keyword, mode: "insensitive" } },
                { memo: { contains: keyword, mode: "insensitive" } },
                { owner: { displayName: { contains: keyword, mode: "insensitive" } } },
                { owner: { username: { contains: keyword, mode: "insensitive" } } }
              ]
            }
          : {})
      },
      include: goalInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    res.json({ goals });
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
    const title = parseText(req.body.title);
    if (!title) {
      res.status(400).json({ message: "目標タイトルを入力してください" });
      return;
    }

    const targetValue = parseOptionalNumber(req.body.targetValue);
    const currentValue = parseOptionalNumber(req.body.currentValue);
    const goal = await prisma.sharedGoal.create({
      data: {
        title,
        category: parseCategory(req.body.category),
        description: parseOptionalText(req.body.description),
        targetValue,
        currentValue,
        unit: parseOptionalText(req.body.unit),
        progressRate: progressRate(targetValue, currentValue),
        status: parseGoalStatus(req.body.status),
        dueDate: parseDate(req.body.dueDate),
        memo: parseOptionalText(req.body.memo),
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

    const title = "title" in req.body ? parseText(req.body.title) : existing.title;
    if (!title) {
      res.status(400).json({ message: "目標タイトルを入力してください" });
      return;
    }

    const targetValue = "targetValue" in req.body ? parseOptionalNumber(req.body.targetValue) : existing.targetValue;
    const currentValue =
      "currentValue" in req.body ? parseOptionalNumber(req.body.currentValue) : existing.currentValue;

    const goal = await prisma.sharedGoal.update({
      where: { id: existing.id },
      data: {
        title,
        category: "category" in req.body ? parseCategory(req.body.category) : existing.category,
        description: "description" in req.body ? parseOptionalText(req.body.description) : existing.description,
        targetValue,
        currentValue,
        unit: "unit" in req.body ? parseOptionalText(req.body.unit) : existing.unit,
        progressRate: progressRate(targetValue, currentValue),
        status: "status" in req.body ? parseGoalStatus(req.body.status, existing.status as GoalStatus) : existing.status,
        dueDate: "dueDate" in req.body ? parseDate(req.body.dueDate) : existing.dueDate,
        memo: "memo" in req.body ? parseOptionalText(req.body.memo) : existing.memo
      },
      include: goalInclude
    });

    res.json({ goal });
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
    const title = parseText(req.body.title);
    const targetUserId = parseText(req.body.targetUserId);

    if (!title || !targetUserId) {
      res.status(400).json({ message: "提案先と目標タイトルを入力してください" });
      return;
    }

    if (targetUserId === currentUserId(req)) {
      res.status(400).json({ message: "自分以外の団員を選んでください" });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!targetUser) {
      res.status(404).json({ message: "提案先の団員が見つかりません" });
      return;
    }

    const proposal = await prisma.goalProposal.create({
      data: {
        proposerUserId: currentUserId(req),
        targetUserId,
        title,
        category: parseCategory(req.body.category),
        description: parseOptionalText(req.body.description),
        targetValue: parseOptionalNumber(req.body.targetValue),
        unit: parseOptionalText(req.body.unit),
        dueDate: parseDate(req.body.dueDate),
        proposalMemo: parseOptionalText(req.body.proposalMemo)
      },
      include: proposalInclude
    });

    res.status(201).json({ proposal });
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

    const result = await prisma.$transaction(async (tx) => {
      const targetValue = existing.targetValue;
      const goal = await tx.sharedGoal.create({
        data: {
          title: existing.title,
          category: existing.category,
          description: existing.description,
          targetValue,
          currentValue: 0,
          unit: existing.unit,
          progressRate: progressRate(targetValue, 0),
          status: "未着手",
          dueDate: existing.dueDate,
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
