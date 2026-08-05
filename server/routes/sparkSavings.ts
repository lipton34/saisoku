import { Router, type Request } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import {
  parseOptionalText,
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

function jstMonthStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return new Date(`${year}-${month}-01T00:00:00.000Z`);
}

function historyData(savings: { id: string; ownerId: string; crystalCount: number; singleTicketCount: number; tenPullTicketCount: number }, entryType: string, deltas: [number, number, number], title: string, memo: string | null) {
  return { savingsId: savings.id, ownerId: savings.ownerId, entryType, crystalDelta: deltas[0], singleTicketDelta: deltas[1], tenPullTicketDelta: deltas[2], crystalBalance: savings.crystalCount, singleTicketBalance: savings.singleTicketCount, tenPullTicketBalance: savings.tenPullTicketCount, title, memo };
}

function serializeHistory(entry: { id: string; entryType: string; crystalDelta: number; singleTicketDelta: number; tenPullTicketDelta: number; crystalBalance: number; singleTicketBalance: number; tenPullTicketBalance: number; title: string; memo: string | null; createdAt: Date }) {
  return { ...entry, createdAt: entry.createdAt.toISOString() };
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
    const savings = await prisma.$transaction(async (tx) => {
      const before = await tx.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(userId) });
      const saved = await tx.sparkSavings.upsert({ where: sparkSavingsOwnerWhere(userId), update: parsed.value, create: { ...parsed.value, ownerId: userId } });
      if (before?.historyStartedAt && (before.crystalCount !== saved.crystalCount || before.singleTicketCount !== saved.singleTicketCount || before.tenPullTicketCount !== saved.tenPullTicketCount)) {
        await tx.sparkSavingsHistory.create({ data: historyData(saved, "adjustment", [saved.crystalCount - before.crystalCount, saved.singleTicketCount - before.singleTicketCount, saved.tenPullTicketCount - before.tenPullTicketCount], "残高を編集", null) });
      }
      return saved;
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

    const savings = await prisma.$transaction(async (tx) => {
      const saved = await tx.sparkSavings.update({ where: { id: existing.id }, data: sparkSavingsResetData });
      if (existing.historyStartedAt && (existing.crystalCount || existing.singleTicketCount || existing.tenPullTicketCount)) {
        await tx.sparkSavingsHistory.create({ data: historyData(saved, "adjustment", [-existing.crystalCount, -existing.singleTicketCount, -existing.tenPullTicketCount], "残高をリセット", null) });
      }
      return saved;
    });
    res.json({
      sparkSavings: serializeSparkSavings(savings),
      message: "天井貯金をリセットしました。"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/history/activate", async (req, res, next) => {
  try {
    const userId = ownerId(req);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(userId) });
      if (existing?.historyStartedAt) return existing;
      const month = jstMonthStart();
      const savings = existing
        ? await tx.sparkSavings.update({ where: { id: existing.id }, data: { historyStartedAt: new Date(), historySummaryStartMonth: month } })
        : await tx.sparkSavings.create({ data: { ownerId: userId, historyStartedAt: new Date(), historySummaryStartMonth: month } });
      await tx.sparkSavingsHistory.create({ data: historyData(savings, "start", [0, 0, 0], "履歴を開始", null) });
      return savings;
    });
    res.status(201).json({ sparkSavings: serializeSparkSavings(result), message: "獲得履歴を開始しました。" });
  } catch (error) { next(error); }
});

router.get("/history", async (req, res, next) => {
  try {
    const userId = ownerId(req);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const entries = await prisma.sparkSavingsHistory.findMany({ where: { ownerId: userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    const hasMore = entries.length > 50;
    const page = entries.slice(0, 50);
    res.json({ entries: page.map(serializeHistory), nextCursor: hasMore ? page.at(-1)?.id ?? null : null });
  } catch (error) { next(error); }
});

router.get("/history/summary", async (req, res, next) => {
  try {
    const savings = await prisma.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(ownerId(req)) });
    if (!savings?.historyStartedAt) { res.json({ months: [] }); return; }
    const entries = await prisma.sparkSavingsHistory.findMany({ where: { ownerId: ownerId(req), entryType: { not: "start" }, createdAt: { gte: savings.historySummaryStartMonth ?? savings.historyStartedAt } }, orderBy: { createdAt: "asc" } });
    const grouped = new Map<string, { month: string; earnedEquivalent: number; spentEquivalent: number; adjustmentEquivalent: number; entryCount: number }>();
    for (const entry of entries) {
      const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(entry.createdAt);
      const current = grouped.get(month) ?? { month, earnedEquivalent: 0, spentEquivalent: 0, adjustmentEquivalent: 0, entryCount: 0 };
      const equivalent = entry.crystalDelta + entry.singleTicketDelta * 300 + entry.tenPullTicketDelta * 3000;
      if (entry.entryType === "earn") current.earnedEquivalent += equivalent;
      else if (entry.entryType === "spend") current.spentEquivalent += Math.abs(equivalent);
      else current.adjustmentEquivalent += equivalent;
      current.entryCount += 1; grouped.set(month, current);
    }
    res.json({ months: [...grouped.values()].reverse() });
  } catch (error) { next(error); }
});

router.post("/history/entries", async (req, res, next) => {
  try {
    const input = req.body as Record<string, unknown>;
    const entryType = input.entryType;
    if (!['earn', 'spend', 'adjustment'].includes(String(entryType))) { res.status(400).json({ message: "操作種別を確認してください" }); return; }
    const parsed = parseSparkSavingsInput(input);
    if (!parsed.ok) { res.status(400).json({ message: parsed.message }); return; }
    let title: string; let memo: string | null;
    try { title = parseOptionalText(input.title, "タイトル", 100) ?? (entryType === "earn" ? "獲得" : entryType === "spend" ? "使用" : "残高調整"); memo = parseOptionalText(input.memo, "メモ", 500); } catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : "入力内容を確認してください" }); return; }
    const userId = ownerId(req);
    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(userId) });
      if (!before?.historyStartedAt) throw new Error("HISTORY_INACTIVE");
      const sign = entryType === "spend" ? -1 : 1;
      const next = entryType === "adjustment" ? parsed.value : { crystalCount: before.crystalCount + sign * parsed.value.crystalCount, singleTicketCount: before.singleTicketCount + sign * parsed.value.singleTicketCount, tenPullTicketCount: before.tenPullTicketCount + sign * parsed.value.tenPullTicketCount };
      if (next.crystalCount < 0 || next.singleTicketCount < 0 || next.tenPullTicketCount < 0) throw new Error("INSUFFICIENT_BALANCE");
      const savings = await tx.sparkSavings.update({ where: { id: before.id }, data: next });
      const deltas: [number, number, number] = [next.crystalCount - before.crystalCount, next.singleTicketCount - before.singleTicketCount, next.tenPullTicketCount - before.tenPullTicketCount];
      const entry = await tx.sparkSavingsHistory.create({ data: historyData(savings, String(entryType), deltas, title, memo) });
      return { savings, entry };
    });
    res.status(201).json({ sparkSavings: serializeSparkSavings(result.savings), entry: serializeHistory(result.entry), message: "履歴を記録しました。" });
  } catch (error) {
    if (error instanceof Error && error.message === "HISTORY_INACTIVE") { res.status(409).json({ message: "先に獲得履歴を開始してください" }); return; }
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") { res.status(400).json({ message: "残高を超えて使用できません" }); return; }
    next(error);
  }
});

router.patch("/history/summary-start", async (req, res, next) => {
  try {
    const value = (req.body as Record<string, unknown>).month;
    if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) { res.status(400).json({ message: "開始月を確認してください" }); return; }
    const requested = new Date(`${value}-01T00:00:00.000Z`);
    const savings = await prisma.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(ownerId(req)) });
    if (!savings?.historyStartedAt) { res.status(409).json({ message: "履歴が開始されていません" }); return; }
    const earliest = jstMonthStart(savings.historyStartedAt); const latest = jstMonthStart();
    if (requested < earliest || requested > latest) { res.status(400).json({ message: "開始月は履歴開始月から現在月の範囲で選択してください" }); return; }
    const updated = await prisma.sparkSavings.update({ where: { id: savings.id }, data: { historySummaryStartMonth: requested } });
    res.json({ sparkSavings: serializeSparkSavings(updated), message: "集計の開始月を変更しました。" });
  } catch (error) { next(error); }
});

router.delete("/history", async (req, res, next) => {
  try {
    const savings = await prisma.sparkSavings.findUnique({ where: sparkSavingsOwnerWhere(ownerId(req)) });
    if (!savings) { res.json({ sparkSavings: null, message: "削除する履歴はありません。" }); return; }
    const updated = await prisma.$transaction(async (tx) => { await tx.sparkSavingsHistory.deleteMany({ where: { ownerId: ownerId(req) } }); return tx.sparkSavings.update({ where: { id: savings.id }, data: { historyStartedAt: null, historySummaryStartMonth: null } }); });
    res.json({ sparkSavings: serializeSparkSavings(updated), message: "履歴を削除しました。残高は維持されています。" });
  } catch (error) { next(error); }
});

export { router as sparkSavingsRouter };
