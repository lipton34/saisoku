import { Router, type Request } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import {
  parseSparkSavingsInput,
  serializeSparkSavings,
  sparkSavingsOwnerWhere,
  sparkSavingsResetData
} from "../lib/sparkSavings.js";

const router = Router();
router.use(requireAuth);

function ownerId(req: Request) {
  return req.user?.id ?? "";
}

router.get("/", async (req, res, next) => {
  try {
    const savings = await prisma.sparkSavings.findUnique({
      where: sparkSavingsOwnerWhere(ownerId(req))
    });
    res.json({ sparkSavings: savings ? serializeSparkSavings(savings) : null });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const parsed = parseSparkSavingsInput(req.body);
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message });
      return;
    }

    const userId = ownerId(req);
    const savings = await prisma.sparkSavings.upsert({
      where: sparkSavingsOwnerWhere(userId),
      update: parsed.value,
      create: { ...parsed.value, ownerId: userId }
    });
    res.json({
      sparkSavings: serializeSparkSavings(savings),
      message: "天井貯金を保存しました。"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset", async (req, res, next) => {
  try {
    const existing = await prisma.sparkSavings.findUnique({
      where: sparkSavingsOwnerWhere(ownerId(req))
    });
    if (!existing) {
      res.json({ sparkSavings: null, message: "リセットする天井貯金はありません。" });
      return;
    }

    const savings = await prisma.sparkSavings.update({
      where: { id: existing.id },
      data: sparkSavingsResetData
    });
    res.json({
      sparkSavings: serializeSparkSavings(savings),
      message: "天井貯金をリセットしました。"
    });
  } catch (error) {
    next(error);
  }
});

export { router as sparkSavingsRouter };
