import {
  ExtractedNewsEventType,
  ExtractedNewsItemType,
  SourceArticleType
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Router, type RequestHandler } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();
const newsItemsRouter = Router();
const sourceArticlesRouter = Router();
const newsFetchLogsRouter = Router();

router.use(requireAuth);
newsItemsRouter.use(requireAuth);
sourceArticlesRouter.use(requireAuth);
newsFetchLogsRouter.use(requireAuth);

const itemTypes = new Set<string>(Object.values(ExtractedNewsItemType));
const eventTypes = new Set<string>(Object.values(ExtractedNewsEventType));
const articleTypes = new Set<string>(Object.values(SourceArticleType));

function textQuery(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLimit(value: unknown) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) {
    return 50;
  }

  return Math.min(limit, 100);
}

function parseOffset(value: unknown) {
  const offset = Number(value);
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

function parseDate(value: unknown) {
  const text = textQuery(value);
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value: unknown) {
  return value === "true" || value === "1";
}

function normalizeFetchLogStatus(log: { finishedAt: Date | null; failedCount: number; errorMessage: string | null }) {
  if (!log.finishedAt) {
    return "running";
  }

  return log.failedCount > 0 || log.errorMessage ? "error" : "success";
}

async function categoryNameMap() {
  const categories = await prisma.officialNewsCategory.findMany({
    select: { sourceCategoryId: true, slug: true, name: true },
    orderBy: { sortOrder: "asc" }
  });

  return new Map(categories.map((category) => [category.slug, category]));
}

const listNewsItems: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const itemType = textQuery(req.query.itemType);
    const eventType = textQuery(req.query.eventType);
    const keyword = textQuery(req.query.keyword);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const includeHidden = parseBoolean(req.query.includeHidden);

    const and: Prisma.ExtractedNewsItemWhereInput[] = [];
    if (from || to) {
      and.push({
        OR: [
          { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
          { updateAtCandidate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        ]
      });
    }
    if (keyword) {
      and.push({
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { rawDateText: { contains: keyword, mode: "insensitive" } },
          { summary: { contains: keyword, mode: "insensitive" } },
          { relatedKey: { contains: keyword, mode: "insensitive" } },
          { sourceArticle: { title: { contains: keyword, mode: "insensitive" } } }
        ]
      });
    }

    const where: Prisma.ExtractedNewsItemWhereInput = {
      ...(includeHidden ? {} : { isVisible: true }),
      ...(itemTypes.has(itemType) ? { itemType: itemType as ExtractedNewsItemType } : {}),
      ...(eventTypes.has(eventType) ? { eventType: eventType as ExtractedNewsEventType } : {}),
      ...(and.length > 0 ? { AND: and } : {})
    };

    const [total, items] = await Promise.all([
      prisma.extractedNewsItem.count({ where }),
      prisma.extractedNewsItem.findMany({
        where,
        include: {
          sourceArticle: {
            select: {
              sourceArticleId: true,
              title: true,
              officialUrl: true,
              publishedAt: true,
              articleType: true
            }
          }
        },
        orderBy: [
          { startsAt: { sort: "asc", nulls: "last" } },
          { sourceArticle: { publishedAt: { sort: "desc", nulls: "last" } } },
          { displayPriority: "asc" }
        ],
        skip: offset,
        take: limit
      })
    ]);

    res.json({
      items: items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        title: item.title,
        eventType: item.eventType,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        updateAtCandidate: item.updateAtCandidate,
        rawDateText: item.rawDateText,
        summary: item.summary,
        infoStatus: item.infoStatus,
        extractionConfidence: item.extractionConfidence,
        tags: item.tags,
        relatedKey: item.relatedKey,
        displayPriority: item.displayPriority,
        isVisible: item.isVisible,
        article: item.sourceArticle
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
};

const listSourceArticles: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const articleType = textQuery(req.query.articleType);
    const keyword = textQuery(req.query.keyword);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const categoryMap = await categoryNameMap();

    const where: Prisma.SourceArticleWhereInput = {
      ...(articleTypes.has(articleType) ? { articleType: articleType as SourceArticleType } : {}),
      ...(from || to ? { publishedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { sourceArticleId: { contains: keyword, mode: "insensitive" } },
              { officialUrl: { contains: keyword, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, articles] = await Promise.all([
      prisma.sourceArticle.count({ where }),
      prisma.sourceArticle.findMany({
        where,
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { lastCheckedAt: "desc" }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          sourceArticleId: true,
          title: true,
          officialUrl: true,
          publishedAt: true,
          articleType: true,
          fetchedAt: true,
          lastCheckedAt: true,
          contentHash: true,
          status: true,
          categorySlugs: true
        }
      })
    ]);

    res.json({
      articles: articles.map((article) => ({
        id: article.id,
        sourceArticleId: article.sourceArticleId,
        title: article.title,
        officialUrl: article.officialUrl,
        publishedAt: article.publishedAt,
        articleType: article.articleType,
        fetchStatus: article.status,
        parseStatus: "parsed",
        contentHash: article.contentHash,
        lastFetchedAt: article.fetchedAt,
        lastParsedAt: article.lastCheckedAt,
        categories: article.categorySlugs.map((slug) => categoryMap.get(slug) ?? { slug, name: slug })
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
};

const listNewsFetchLogs: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const runType = textQuery(req.query.runType);
    const status = textQuery(req.query.status);

    const where: Prisma.NewsFetchLogWhereInput = {
      ...(runType ? { runType } : {}),
      ...(status === "error" ? { OR: [{ failedCount: { gt: 0 } }, { errorMessage: { not: null } }] } : {}),
      ...(status === "success" ? { failedCount: 0, errorMessage: null, finishedAt: { not: null } } : {}),
      ...(status === "running" ? { finishedAt: null } : {})
    };

    const [total, logs] = await Promise.all([
      prisma.newsFetchLog.count({ where }),
      prisma.newsFetchLog.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: offset,
        take: limit
      })
    ]);

    res.json({
      logs: logs.map((log) => {
        const skippedCount = Math.max(log.fetchedCount - log.insertedCount - log.updatedCount - log.failedCount, 0);

        return {
          id: log.id,
          runType: log.runType,
          status: normalizeFetchLogStatus(log),
          targetMonth: log.runType === "month" ? log.targetPeriod : null,
          targetStartDate: null,
          targetEndDate: null,
          startedAt: log.startedAt,
          finishedAt: log.finishedAt,
          fetchedCount: log.fetchedCount,
          newCount: log.insertedCount,
          updatedCount: log.updatedCount,
          skippedCount,
          errorCount: log.failedCount,
          errorMessage: log.errorMessage
        };
      }),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
};

router.get("/items", listNewsItems);
router.get("/source-articles", listSourceArticles);
router.get("/fetch-logs", listNewsFetchLogs);
newsItemsRouter.get("/", listNewsItems);
sourceArticlesRouter.get("/", listSourceArticles);
newsFetchLogsRouter.get("/", listNewsFetchLogs);

export { newsFetchLogsRouter, newsItemsRouter, router as officialNewsRouter, sourceArticlesRouter };
