import { Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import { ensureDefaultEventSeries } from "../services/eventSeriesDefaults.js";

const router = Router();

router.use(requireAuth);

const occurrenceInclude = {
  eventSeries: true,
  newsItem: {
    include: {
      sourceArticle: {
        select: {
          sourceArticleId: true,
          title: true,
          officialUrl: true,
          publishedAt: true,
          articleType: true,
        },
      },
    },
  },
  eventNotes: {
    include: { links: { orderBy: { createdAt: "asc" as const } } },
    orderBy: { updatedAt: "desc" as const },
  },
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const parsed = text(value);
  return parsed || null;
}

function parseDate(value: unknown) {
  const parsed = text(value);
  if (!parsed) return null;
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value: unknown, fallback = true) {
  if (value === undefined) return fallback;
  return value === true || value === "true" || value === "1";
}

function occurrenceData(body: Record<string, unknown>) {
  return {
    title: text(body.title),
    startAt: parseDate(body.startAt),
    endAt: parseDate(body.endAt),
    element: optionalText(body.element),
    enemyElement: optionalText(body.enemyElement),
    advantageElement: optionalText(body.advantageElement),
    sourceType: text(body.sourceType) || "manual",
    sourceArticleId: optionalText(body.sourceArticleId),
    officialUrl: optionalText(body.officialUrl),
    confidence: text(body.confidence) || "manual",
    memo: optionalText(body.memo),
    isVisible: parseBoolean(body.isVisible),
  };
}

function inferSeriesKey(title: string, eventType?: string | null) {
  const normalized = title.normalize("NFKC").toLowerCase();
  if (/古戦場|決戦/.test(title)) return "guild_war";
  if (/ドレッドバラージュ/.test(title)) return "dread_barrage";
  if (/四象|四象降臨/.test(title)) return "rotb";
  if (/十天衆戦記/.test(title)) return "tenju_senki";
  if (/アーカルム|外伝/.test(title)) return "arcarum_event";
  if (/ブレイブグラウンド/.test(title)) return "proving_grounds";
  if (/ゼノ/.test(title)) return "xeno_clash";
  if (/バブ.?イール|塔/.test(title)) return "tower_of_babyl";
  if (/コラボ|collab|collaboration/i.test(normalized) || eventType === "collaboration_event") return "collaboration_event";
  if (eventType === "scenario_event") return "scenario_event";
  return "other";
}

function toOccurrencePayload(occurrence: Prisma.EventOccurrenceGetPayload<{ include: typeof occurrenceInclude }>) {
  return {
    id: occurrence.id,
    eventSeries: occurrence.eventSeries,
    newsItem: occurrence.newsItem,
    title: occurrence.title,
    startAt: occurrence.startAt,
    endAt: occurrence.endAt,
    element: occurrence.element,
    enemyElement: occurrence.enemyElement,
    advantageElement: occurrence.advantageElement,
    sourceType: occurrence.sourceType,
    sourceArticleId: occurrence.sourceArticleId,
    officialUrl: occurrence.officialUrl,
    confidence: occurrence.confidence,
    memo: occurrence.memo,
    isVisible: occurrence.isVisible,
    eventNotes: occurrence.eventNotes,
    relatedNewsItems: occurrence.newsItem ? [occurrence.newsItem] : [],
    createdAt: occurrence.createdAt,
    updatedAt: occurrence.updatedAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const eventSeriesId = text(req.query.eventSeriesId);
    const eventType = text(req.query.eventType);
    const keyword = text(req.query.keyword);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const includeHidden = req.query.includeHidden === "true" || req.query.includeHidden === "1";
    const and: Prisma.EventOccurrenceWhereInput[] = [];

    if (from || to) {
      and.push({
        OR: [
          { startAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
          { endAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
        ],
      });
    }
    if (keyword) {
      and.push({
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { memo: { contains: keyword, mode: "insensitive" } },
          { eventSeries: { name: { contains: keyword, mode: "insensitive" } } },
        ],
      });
    }

    const where: Prisma.EventOccurrenceWhereInput = {
      ...(includeHidden ? {} : { isVisible: true }),
      ...(eventSeriesId ? { eventSeriesId } : {}),
      ...(eventType ? { eventSeries: { eventType } } : {}),
      ...(and.length ? { AND: and } : {}),
    };

    const occurrences = await prisma.eventOccurrence.findMany({
      where,
      include: occurrenceInclude,
      orderBy: [
        { startAt: { sort: "asc", nulls: "last" } },
        { endAt: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });

    res.json({ occurrences: occurrences.map(toOccurrencePayload) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const eventSeriesId = text(body.eventSeriesId);
    if (!eventSeriesId) {
      res.status(400).json({ message: "eventSeriesId が必要です" });
      return;
    }
    const data = occurrenceData(body);
    if (!data.title) {
      res.status(400).json({ message: "イベント名を入力してください" });
      return;
    }

    const occurrence = await prisma.eventOccurrence.create({
      data: { ...data, eventSeriesId },
      include: occurrenceInclude,
    });
    res.status(201).json({ occurrence: toOccurrencePayload(occurrence) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.eventOccurrence.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "イベント開催情報が見つかりません" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const data = occurrenceData(body);
    const occurrence = await prisma.eventOccurrence.update({
      where: { id: existing.id },
      data: {
        ...data,
        eventSeriesId: text(body.eventSeriesId) || existing.eventSeriesId,
      },
      include: occurrenceInclude,
    });
    res.json({ occurrence: toOccurrencePayload(occurrence) });
  } catch (error) {
    next(error);
  }
});

router.post("/from-news-item", async (req, res, next) => {
  try {
    await ensureDefaultEventSeries();
    const body = req.body as Record<string, unknown>;
    const newsItemId = text(body.newsItemId);
    if (!newsItemId) {
      res.status(400).json({ message: "newsItemId が必要です" });
      return;
    }
    const newsItem = await prisma.extractedNewsItem.findUnique({
      where: { id: newsItemId },
      include: { sourceArticle: true },
    });
    if (!newsItem) {
      res.status(404).json({ message: "NEWS項目が見つかりません" });
      return;
    }

    let eventSeriesId = text(body.eventSeriesId);
    if (!eventSeriesId) {
      const key = inferSeriesKey(newsItem.title ?? newsItem.sourceArticle.title, newsItem.eventType);
      const series = await prisma.eventSeries.findUnique({ where: { eventKey: key } });
      eventSeriesId = series?.id ?? "";
    }
    if (!eventSeriesId) {
      res.status(400).json({ message: "eventSeriesId を判定できませんでした" });
      return;
    }

    const data = occurrenceData({
      title: text(body.title) || newsItem.title || newsItem.sourceArticle.title,
      startAt: body.startAt ?? newsItem.startsAt?.toISOString(),
      endAt: body.endAt ?? newsItem.endsAt?.toISOString(),
      element: body.element,
      enemyElement: body.enemyElement,
      advantageElement: body.advantageElement,
      sourceType: body.sourceType ?? (newsItem.itemType === "monthly_plan_item" ? "monthly_plan" : "official_news"),
      sourceArticleId: newsItem.sourceArticle.sourceArticleId,
      officialUrl: newsItem.sourceArticle.officialUrl,
      confidence: body.confidence ?? newsItem.infoStatus,
      memo: body.memo,
      isVisible: body.isVisible ?? true,
    });

    const occurrence = await prisma.eventOccurrence.create({
      data: {
        ...data,
        eventSeriesId,
        newsItemId,
      },
      include: occurrenceInclude,
    });
    res.status(201).json({ occurrence: toOccurrencePayload(occurrence) });
  } catch (error) {
    next(error);
  }
});

export { router as eventOccurrencesRouter };
