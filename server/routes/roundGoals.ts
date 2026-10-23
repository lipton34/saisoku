import { Router, type Request } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { isCompleteRoundGoalOrder } from "../lib/roundGoalOrder.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();
router.use(requireAuth);

function ownerId(req: Request) {
  return req.user?.id ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function count(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

const includeBoardGoal = { boardGoal: true };

router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.roundGoal.findMany({
      where: { ownerId: ownerId(req) },
      include: includeBoardGoal,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const goal = await prisma.roundGoal.findFirst({
      where: { id: req.params.id, ownerId: ownerId(req) },
      include: includeBoardGoal
    });
    if (!goal) {
      res.status(404).json({ message: "数量目標が見つかりません" });
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
    const targetCount = count(req.body.targetCount);
    const currentCount = count(req.body.currentCount ?? 0);
    if (!title || targetCount === null || targetCount < 1 || currentCount === null) {
      res.status(400).json({ message: "タイトル、目標数、現在数を確認してください" });
      return;
    }
    const userId = ownerId(req);
    const sortOrder = await prisma.roundGoal.count({ where: { ownerId: userId } });
    const goal = await prisma.$transaction(async (transaction) => {
      const created = await transaction.roundGoal.create({
        data: {
          title,
          targetCount,
          currentCount,
          note: text(req.body.note) || null,
          sortOrder,
          ownerId: userId
        }
      });
      if (req.body.showOnBoard !== false) {
        await transaction.goal.create({
          data: {
            title,
            visibility: "personal",
            boardStatus: "unset",
            ownerId: userId,
            sourceRoundGoalId: created.id
          }
        });
      }
      return transaction.roundGoal.findUniqueOrThrow({ where: { id: created.id }, include: includeBoardGoal });
    });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.roundGoal.findFirst({
      where: { id: req.params.id, ownerId: ownerId(req) },
      include: includeBoardGoal
    });
    if (!existing) {
      res.status(404).json({ message: "数量目標が見つかりません" });
      return;
    }
    const targetCount = req.body.targetCount === undefined ? existing.targetCount : count(req.body.targetCount);
    const currentCount = req.body.currentCount === undefined ? existing.currentCount : count(req.body.currentCount);
    const title = req.body.title === undefined ? existing.title : text(req.body.title);
    if (!title || targetCount === null || targetCount < 1 || currentCount === null) {
      res.status(400).json({ message: "タイトル、目標数、現在数を確認してください" });
      return;
    }
    const userId = ownerId(req);
    const goal = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.roundGoal.update({
        where: { id: existing.id },
        data: {
          title,
          targetCount,
          currentCount,
          note: req.body.note === undefined ? existing.note : text(req.body.note) || null
        }
      });
      if (existing.boardGoal) {
        await transaction.goal.update({
          where: { id: existing.boardGoal.id },
          data: { title }
        });
      } else if (req.body.showOnBoard === true) {
        await transaction.goal.create({
          data: {
            title,
            visibility: "personal",
            boardStatus: "unset",
            ownerId: userId,
            sourceRoundGoalId: existing.id
          }
        });
      }
      return transaction.roundGoal.findUniqueOrThrow({ where: { id: updated.id }, include: includeBoardGoal });
    });
    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

router.put("/order", async (req, res, next) => {
  try {
    const goalIds: unknown = req.body?.goalIds;
    const owner = ownerId(req);
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.roundGoal.findMany({ where: { ownerId: owner }, select: { id: true } });
      if (!isCompleteRoundGoalOrder(goalIds, existing.map((goal) => goal.id))) return false;
      for (const [sortOrder, id] of goalIds.entries()) {
        const result = await tx.roundGoal.updateMany({
          where: { id, ownerId: owner },
          data: { sortOrder }
        });
        if (result.count !== 1) throw new Error("ROUND_ORDER_CONFLICT");
      }
      return true;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!updated) {
      res.status(400).json({ message: "並び順を更新できません。目標一覧を更新して再試行してください" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "ROUND_ORDER_CONFLICT") {
      res.status(409).json({ message: "並び順の更新が競合しました。目標一覧を更新して再試行してください" });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      res.status(409).json({ message: "並び順の更新が競合しました。再試行してください" });
      return;
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.roundGoal.deleteMany({ where: { id: req.params.id, ownerId: ownerId(req) } });
    if (deleted.count === 0) {
      res.status(404).json({ message: "数量目標が見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as roundGoalsRouter };
