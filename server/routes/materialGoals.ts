import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

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

function parseCount(value: unknown, fallback = 0) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) {
    return fallback;
  }

  return count;
}

async function findOwnedGoal(goalId: string, ownerId: string) {
  return prisma.materialGoal.findFirst({
    where: { id: goalId, ownerId }
  });
}

router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.materialGoal.findMany({
      where: { ownerId: currentUserId(req) },
      include: { items: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = parseText(req.body.title);
    const firstItemName = parseText(req.body.firstItemName);

    if (!title) {
      res.status(400).json({ message: "目的名を入力してください" });
      return;
    }

    const requiredCount = parseCount(req.body.firstRequiredCount);
    const ownedCount = parseCount(req.body.firstOwnedCount);

    if (firstItemName && requiredCount <= 0) {
      res.status(400).json({ message: "必要数は1以上で入力してください" });
      return;
    }

    const goal = await prisma.materialGoal.create({
      data: {
        title,
        questName: parseOptionalText(req.body.questName),
        note: parseOptionalText(req.body.note),
        ownerId: currentUserId(req),
        items: firstItemName
          ? {
              create: {
                name: firstItemName,
                requiredCount,
                ownedCount: Math.min(ownedCount, requiredCount)
              }
            }
          : undefined
      },
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await findOwnedGoal(req.params.id, currentUserId(req));
    if (!existing) {
      res.status(404).json({ message: "素材メモが見つかりません" });
      return;
    }

    const title = "title" in req.body ? parseText(req.body.title) : existing.title;

    if (!title) {
      res.status(400).json({ message: "目的名を入力してください" });
      return;
    }

    const goal = await prisma.materialGoal.update({
      where: { id: existing.id },
      data: {
        title,
        questName: "questName" in req.body ? parseOptionalText(req.body.questName) : existing.questName,
        note: "note" in req.body ? parseOptionalText(req.body.note) : existing.note
      },
      include: { items: { orderBy: { createdAt: "asc" } } }
    });

    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.materialGoal.deleteMany({
      where: { id: req.params.id, ownerId: currentUserId(req) }
    });

    if (deleted.count === 0) {
      res.status(404).json({ message: "素材メモが見つかりません" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:goalId/items", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.goalId, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "素材メモが見つかりません" });
      return;
    }

    const name = parseText(req.body.name);
    const requiredCount = parseCount(req.body.requiredCount);
    const ownedCount = parseCount(req.body.ownedCount);

    if (!name || requiredCount <= 0) {
      res.status(400).json({ message: "素材名と必要数を入力してください" });
      return;
    }

    const item = await prisma.materialItem.create({
      data: {
        name,
        requiredCount,
        ownedCount: Math.min(ownedCount, requiredCount),
        note: parseOptionalText(req.body.note),
        goalId: goal.id
      }
    });
    await prisma.materialGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch("/:goalId/items/:itemId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.goalId, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "素材メモが見つかりません" });
      return;
    }

    const existing = await prisma.materialItem.findFirst({
      where: { id: req.params.itemId, goalId: goal.id }
    });
    if (!existing) {
      res.status(404).json({ message: "素材が見つかりません" });
      return;
    }

    const requiredCount =
      "requiredCount" in req.body ? parseCount(req.body.requiredCount, existing.requiredCount) : existing.requiredCount;
    const ownedCount = "ownedCount" in req.body ? parseCount(req.body.ownedCount, existing.ownedCount) : existing.ownedCount;
    const name = "name" in req.body ? parseText(req.body.name) : existing.name;

    if (!name || requiredCount <= 0) {
      res.status(400).json({ message: "素材名と必要数を入力してください" });
      return;
    }

    const item = await prisma.materialItem.update({
      where: { id: existing.id },
      data: {
        name,
        requiredCount,
        ownedCount: Math.min(ownedCount, requiredCount),
        note: "note" in req.body ? parseOptionalText(req.body.note) : existing.note
      }
    });
    await prisma.materialGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete("/:goalId/items/:itemId", async (req, res, next) => {
  try {
    const goal = await findOwnedGoal(req.params.goalId, currentUserId(req));
    if (!goal) {
      res.status(404).json({ message: "素材メモが見つかりません" });
      return;
    }

    const deleted = await prisma.materialItem.deleteMany({
      where: { id: req.params.itemId, goalId: goal.id }
    });

    if (deleted.count === 0) {
      res.status(404).json({ message: "素材が見つかりません" });
      return;
    }

    await prisma.materialGoal.update({ where: { id: goal.id }, data: { updatedAt: new Date() } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as materialGoalsRouter };
