import { RepeatType } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

function parseRepeatType(value: unknown) {
  if (value === RepeatType.daily || value === RepeatType.weekly || value === RepeatType.once) {
    return value;
  }

  return RepeatType.daily;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseResetHour(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 23) {
    return 5;
  }

  return numberValue;
}

function currentUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return req.user?.id ?? "";
}

router.get("/", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { ownerId: currentUserId(req) },
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
    });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      res.status(400).json({ message: "タスク名を入力してください" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: typeof req.body.description === "string" ? req.body.description.trim() : null,
        category: typeof req.body.category === "string" && req.body.category.trim() ? req.body.category.trim() : "日課",
        repeatType: parseRepeatType(req.body.repeatType),
        dueDate: parseDate(req.body.dueDate),
        resetHourJst: parseResetHour(req.body.resetHourJst),
        ownerId: currentUserId(req)
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: currentUserId(req) }
    });

    if (!existing) {
      res.status(404).json({ message: "タスクが見つかりません" });
      return;
    }

    const data = {
      title: typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : existing.title,
      description:
        typeof req.body.description === "string" ? req.body.description.trim() || null : existing.description,
      category:
        typeof req.body.category === "string" && req.body.category.trim() ? req.body.category.trim() : existing.category,
      repeatType: req.body.repeatType ? parseRepeatType(req.body.repeatType) : existing.repeatType,
      dueDate: "dueDate" in req.body ? parseDate(req.body.dueDate) : existing.dueDate,
      resetHourJst: "resetHourJst" in req.body ? parseResetHour(req.body.resetHourJst) : existing.resetHourJst
    };

    const task = await prisma.task.update({
      where: { id: existing.id },
      data
    });

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.task.deleteMany({
      where: { id: req.params.id, ownerId: currentUserId(req) }
    });

    if (deleted.count === 0) {
      res.status(404).json({ message: "タスクが見つかりません" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", async (req, res, next) => {
  try {
    const task = await prisma.task.updateMany({
      where: { id: req.params.id, ownerId: currentUserId(req) },
      data: { isCompleted: true, completedAt: new Date() }
    });

    if (task.count === 0) {
      res.status(404).json({ message: "タスクが見つかりません" });
      return;
    }

    const updated = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reopen", async (req, res, next) => {
  try {
    const task = await prisma.task.updateMany({
      where: { id: req.params.id, ownerId: currentUserId(req) },
      data: { isCompleted: false, completedAt: null }
    });

    if (task.count === 0) {
      res.status(404).json({ message: "タスクが見つかりません" });
      return;
    }

    const updated = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
});

export { router as tasksRouter };
