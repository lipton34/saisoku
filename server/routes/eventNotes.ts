import { Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import { buildEventKey, eventKeySimilarity, normalizeEventKey } from "../services/eventNoteKeys.js";

const router = Router();

router.use(requireAuth);

type LinkInput = {
  url?: unknown;
  title?: unknown;
  siteName?: unknown;
  memo?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const parsed = text(value);
  return parsed.length > 0 ? parsed : null;
}

function noteData(body: Record<string, unknown>) {
  return {
    title: text(body.title),
    minimumGoals: optionalText(body.minimumGoals),
    targetWeapons: optionalText(body.targetWeapons),
    targetSummons: optionalText(body.targetSummons),
    targetItems: optionalText(body.targetItems),
    farmingNotes: optionalText(body.farmingNotes),
    cautionNotes: optionalText(body.cautionNotes),
    freeMemo: optionalText(body.freeMemo),
  };
}

function parseLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Map<string, { url: string; title: string | null; siteName: string | null; memo: string | null }>();
  for (const item of value as LinkInput[]) {
    const url = text(item.url);
    if (!url || !isSafeUrl(url)) {
      continue;
    }
    deduped.set(url, {
      url,
      title: optionalText(item.title),
      siteName: optionalText(item.siteName),
      memo: optionalText(item.memo),
    });
  }

  return [...deduped.values()];
}

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const noteInclude = {
  links: { orderBy: { createdAt: "asc" as const } },
  newsItem: {
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      relatedKey: true,
      sourceArticle: {
        select: {
          title: true,
          officialUrl: true,
        },
      },
    },
  },
};

async function findNewsItem(newsItemId: string) {
  return prisma.extractedNewsItem.findUnique({
    where: { id: newsItemId },
    include: { sourceArticle: true },
  });
}

function toNotePayload(note: Prisma.EventNoteGetPayload<{ include: typeof noteInclude }>) {
  return {
    id: note.id,
    eventKey: note.eventKey,
    newsItemId: note.newsItemId,
    title: note.title,
    minimumGoals: note.minimumGoals,
    targetWeapons: note.targetWeapons,
    targetSummons: note.targetSummons,
    targetItems: note.targetItems,
    farmingNotes: note.farmingNotes,
    cautionNotes: note.cautionNotes,
    freeMemo: note.freeMemo,
    sourceNoteId: note.sourceNoteId,
    links: note.links.map(toLinkPayload),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function toCandidatePayload(note: Prisma.EventNoteGetPayload<{ include: typeof noteInclude }>) {
  return {
    ...toNotePayload(note),
    sourceNewsItem: {
      title: note.newsItem.title,
      startsAt: note.newsItem.startsAt,
      endsAt: note.newsItem.endsAt,
      articleTitle: note.newsItem.sourceArticle.title,
      officialUrl: note.newsItem.sourceArticle.officialUrl,
    },
  };
}

function toLinkPayload(link: { id: string; url: string; title: string | null; siteName: string | null; memo: string | null }) {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    siteName: link.siteName,
    memo: link.memo,
  };
}

async function resolveEventKey(newsItemId?: string, explicitEventKey?: string) {
  const cleanKey = text(explicitEventKey);
  if (cleanKey) return normalizeEventKey(cleanKey);
  if (!newsItemId) return "";
  const newsItem = await findNewsItem(newsItemId);
  if (!newsItem) {
    throw new Error("NEWS項目が見つかりません");
  }
  return buildEventKey(newsItem);
}

router.get("/", async (req, res, next) => {
  try {
    const newsItemId = text(req.query.newsItemId);
    const eventKey = text(req.query.eventKey);
    const where: Prisma.EventNoteWhereInput = {
      ...(newsItemId ? { newsItemId } : {}),
      ...(eventKey ? { eventKey: normalizeEventKey(eventKey) } : {}),
    };

    const notes = await prisma.eventNote.findMany({
      where,
      include: noteInclude,
      orderBy: { updatedAt: "desc" },
    });

    res.json({ notes: notes.map(toNotePayload) });
  } catch (error) {
    next(error);
  }
});

router.get("/candidates", async (req, res, next) => {
  try {
    const newsItemId = text(req.query.newsItemId);
    const eventKey = await resolveEventKey(newsItemId, text(req.query.eventKey));
    if (!eventKey) {
      res.json({ eventKey: "", candidates: [] });
      return;
    }

    const exact = await prisma.eventNote.findMany({
      where: {
        eventKey,
        ...(newsItemId ? { newsItemId: { not: newsItemId } } : {}),
      },
      include: noteInclude,
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    const candidates =
      exact.length > 0
        ? exact
        : (
            await prisma.eventNote.findMany({
              where: newsItemId ? { newsItemId: { not: newsItemId } } : {},
              include: noteInclude,
              orderBy: { updatedAt: "desc" },
              take: 50,
            })
          )
            .filter((note) => eventKeySimilarity(eventKey, note.eventKey) >= 0.34)
            .slice(0, 8);

    res.json({ eventKey, candidates: candidates.map(toCandidatePayload) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const newsItemId = text(body.newsItemId);
    if (!newsItemId) {
      res.status(400).json({ message: "newsItemId が必要です" });
      return;
    }

    const newsItem = await findNewsItem(newsItemId);
    if (!newsItem) {
      res.status(404).json({ message: "NEWS項目が見つかりません" });
      return;
    }

    const data = noteData(body);
    if (!data.title) {
      res.status(400).json({ message: "メモタイトルを入力してください" });
      return;
    }

    const links = parseLinks(body.links);
    const eventKey = text(body.eventKey) ? normalizeEventKey(text(body.eventKey)) : buildEventKey(newsItem);
    const note = await prisma.eventNote.create({
      data: {
        ...data,
        eventKey,
        newsItemId,
        links: links.length > 0 ? { create: links } : undefined,
      },
      include: noteInclude,
    });

    res.status(201).json({ note: toNotePayload(note) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const existing = await prisma.eventNote.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "攻略メモが見つかりません" });
      return;
    }

    const data = noteData(body);
    if (!data.title) {
      res.status(400).json({ message: "メモタイトルを入力してください" });
      return;
    }

    const links = parseLinks(body.links);
    const note = await prisma.eventNote.update({
      where: { id: existing.id },
      data: {
        ...data,
        links: {
          deleteMany: {},
          create: links,
        },
      },
      include: noteInclude,
    });

    res.json({ note: toNotePayload(note) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.eventNote.deleteMany({
      where: { id: req.params.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ message: "攻略メモが見つかりません" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/copy", async (req, res, next) => {
  try {
    const newsItemId = text(req.body.newsItemId);
    if (!newsItemId) {
      res.status(400).json({ message: "newsItemId が必要です" });
      return;
    }

    const [sourceNote, newsItem] = await Promise.all([
      prisma.eventNote.findUnique({
        where: { id: req.params.id },
        include: { links: true },
      }),
      findNewsItem(newsItemId),
    ]);

    if (!sourceNote) {
      res.status(404).json({ message: "コピー元メモが見つかりません" });
      return;
    }
    if (!newsItem) {
      res.status(404).json({ message: "コピー先NEWS項目が見つかりません" });
      return;
    }

    const note = await prisma.eventNote.create({
      data: {
        eventKey: buildEventKey(newsItem),
        newsItemId,
        title: sourceNote.title,
        minimumGoals: sourceNote.minimumGoals,
        targetWeapons: sourceNote.targetWeapons,
        targetSummons: sourceNote.targetSummons,
        targetItems: sourceNote.targetItems,
        farmingNotes: sourceNote.farmingNotes,
        cautionNotes: sourceNote.cautionNotes,
        freeMemo: sourceNote.freeMemo,
        sourceNoteId: sourceNote.id,
        links: {
          create: sourceNote.links.map((link) => ({
            url: link.url,
            title: link.title,
            siteName: link.siteName,
            memo: link.memo,
          })),
        },
      },
      include: noteInclude,
    });

    res.status(201).json({ note: toNotePayload(note) });
  } catch (error) {
    next(error);
  }
});

export { router as eventNotesRouter };
