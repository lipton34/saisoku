import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { OfficialNewsService } from "../services/officialNews.js";

const router = Router();

router.use(requireAuth);

let isOfficialNewsFetchRunning = false;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOption(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("maxPages は1以上の整数で指定してください");
  }
  return parsed;
}

function normalizeMonth(value: unknown) {
  const targetMonth = text(value);
  if (!/^(\d{4})-?(\d{2})$/.test(targetMonth)) {
    throw new Error("targetMonth は YYYY-MM または YYYYMM で指定してください");
  }
  return targetMonth;
}

function toResponse(summary: Awaited<ReturnType<OfficialNewsService["syncLatestNews"]>>, extra: {
  message: string;
  runType: string;
  targetMonth?: string | null;
}) {
  return {
    ok: summary.failedCount === 0,
    runType: extra.runType,
    targetMonth: extra.targetMonth ?? summary.targetMonth,
    fetchedCount: summary.fetchedCount,
    insertedCount: summary.insertedCount,
    updatedCount: summary.updatedCount,
    failedCount: summary.failedCount,
    fetchedPages: summary.fetchedPages,
    totalPageCnt: summary.totalPageCnt,
    maxPages: summary.maxPages,
    message: extra.message,
    errors: summary.errors,
  };
}

async function runWithLock<T>(callback: () => Promise<T>) {
  if (isOfficialNewsFetchRunning) {
    return {
      locked: true as const,
      response: {
        ok: false,
        message: "NEWS取得処理が実行中です。完了後に再実行してください。",
      },
    };
  }

  // MVP用のプロセス内ロック。複数インスタンス構成では完全な排他にはならない。
  isOfficialNewsFetchRunning = true;
  try {
    return { locked: false as const, response: await callback() };
  } finally {
    isOfficialNewsFetchRunning = false;
  }
}

router.post("/fetch/latest", async (req, res, next) => {
  try {
    const maxPages = numberOption(req.body.maxPages);
    const result = await runWithLock(async () => {
      const service = new OfficialNewsService();
      const summary = await service.syncLatestNews({ maxPages });
      return toResponse(summary, {
        runType: "latest",
        message: "最新NEWSを取得しました",
      });
    });
    res.json(result.response);
  } catch (error) {
    next(error);
  }
});

router.post("/fetch/month", async (req, res, next) => {
  try {
    const targetMonth = normalizeMonth(req.body.targetMonth);
    const maxPages = numberOption(req.body.maxPages);
    const result = await runWithLock(async () => {
      const service = new OfficialNewsService();
      const summary = await service.syncMonthlyArchive(targetMonth, { maxPages });
      return toResponse(summary, {
        runType: "monthly_archive",
        targetMonth,
        message: `${targetMonth} のNEWSを取得しました`,
      });
    });
    res.json(result.response);
  } catch (error) {
    next(error);
  }
});

router.post("/reanalyze", async (req, res, next) => {
  try {
    const sourceArticleId = text(req.body.sourceArticleId);
    if (!sourceArticleId) {
      res.status(400).json({ ok: false, message: "sourceArticleId が必要です" });
      return;
    }

    const result = await runWithLock(async () => {
      const service = new OfficialNewsService();
      const summary = await service.reanalyzeArticle(sourceArticleId);
      return toResponse(summary, {
        runType: "reanalyze",
        targetMonth: sourceArticleId,
        message: `${sourceArticleId} を再解析しました`,
      });
    });
    res.json(result.response);
  } catch (error) {
    next(error);
  }
});

export { router as officialNewsFetchRouter };
