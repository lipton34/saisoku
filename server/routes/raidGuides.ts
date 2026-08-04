import { Prisma } from "@prisma/client";
import { Router, type Request } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const raidGuidesRouter = Router();
const raidGuideStrategiesRouter = Router();
raidGuidesRouter.use(requireAuth);
raidGuideStrategiesRouter.use(requireAuth);

const visibilities = new Set(["crew", "personal"]);
const stickyColors = new Set(["yellow", "blue", "green", "pink", "purple"]);

function userId(req: Request) {
  return req.user?.id ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return text(value) || null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type StickyInput = { guideRowId: string | null; body: string; color: string };

function parseStickyNotes(value: unknown): StickyInput[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const parsed: StickyInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    const body = text(record.body);
    const color = text(record.color) || "yellow";
    const guideRowId = optionalText(record.guideRowId);
    if (!body || body.length > 500 || !stickyColors.has(color)) return null;
    parsed.push({ guideRowId, body, color });
  }
  return parsed;
}

async function validateStrategyInput(guideId: string, body: Record<string, unknown>) {
  const title = text(body.title);
  const overview = optionalText(body.overview);
  const visibility = text(body.visibility) || "crew";
  const buildPostId = optionalText(body.buildPostId);
  const stickyNotes = parseStickyNotes(body.stickyNotes ?? []);
  if (!title || title.length > 100) return { error: "タイトルは100文字以内で入力してください" } as const;
  if ((overview?.length ?? 0) > 500) return { error: "概要は500文字以内で入力してください" } as const;
  if (!visibilities.has(visibility)) return { error: "公開範囲を確認してください" } as const;
  if (!stickyNotes) return { error: "付箋は50件まで、本文は500文字までです" } as const;

  const inlineTargetIds = stickyNotes.flatMap((note) => [...note.body.matchAll(/\[\[page:([^|\]]+)\|[^\]]+\]\]/g)].map((match) => match[1]));
  const malformedLink = stickyNotes.some((note) => note.body.replace(/\[\[page:[^|\]]+\|[^\]]+\]\]/g, "").includes("[[page:"));
  if (malformedLink) return { error: "付箋内のページリンクを確認してください" } as const;
  const rowIds = [...new Set(stickyNotes.flatMap((note) => note.guideRowId ? [note.guideRowId] : []).concat(inlineTargetIds))];
  const [rowCount, buildCount] = await Promise.all([
    prisma.raidGuideRow.count({ where: { id: { in: rowIds }, guideId, isActive: true } }),
    buildPostId ? prisma.buildPost.count({ where: { id: buildPostId } }) : Promise.resolve(0)
  ]);
  if (rowCount !== rowIds.length) return { error: "付箋を追加する攻略行が見つかりません" } as const;
  if (buildPostId && buildCount !== 1) return { error: "関連編成が見つかりません" } as const;
  return { value: { title, overview, visibility, buildPostId, stickyNotes } } as const;
}

const strategyInclude = {
  owner: { select: { id: true, username: true, displayName: true } },
  buildPost: {
    select: {
      id: true,
      title: true,
      questName: true,
      images: { orderBy: [{ displayOrder: "asc" as const }], take: 1 }
    }
  },
  stickyNotes: { orderBy: [{ sortOrder: "asc" as const }] }
};

function serializeStrategy<T extends {
  owner: { id: string; username: string; displayName: string | null };
  stickyNotes: unknown[];
}>(strategy: T) {
  return {
    ...strategy,
    authorName: strategy.owner.displayName ?? strategy.owner.username,
    stickyNoteCount: strategy.stickyNotes.length
  };
}

raidGuidesRouter.get("/", async (_req, res, next) => {
  try {
    const guides = await prisma.raidGuide.findMany({
      where: { isActive: true, questMaster: { isActive: true, kind: "quest" } },
      include: {
        questMaster: { select: { id: true, name: true, displayName: true, element: true, category: true } }
      },
      orderBy: [{ createdAt: "desc" }, { sortOrder: "asc" }, { title: "asc" }]
    });
    const quests = new Map<string, {
      id: string;
      name: string;
      element: string | null;
      category: string | null;
      guides: { id: string; title: string; createdAt: Date }[];
    }>();
    for (const guide of guides) {
      const existing = quests.get(guide.questMasterId) ?? {
        id: guide.questMasterId,
        name: guide.questMaster.displayName ?? guide.questMaster.name,
        element: guide.questMaster.element,
        category: guide.questMaster.category,
        guides: []
      };
      existing.guides.push({ id: guide.id, title: guide.title, createdAt: guide.createdAt });
      quests.set(guide.questMasterId, existing);
    }
    res.json({ quests: [...quests.values()] });
  } catch (error) {
    next(error);
  }
});

raidGuidesRouter.get("/:guideId/reader", async (req, res, next) => {
  try {
    const guide = await prisma.raidGuide.findUnique({
      where: { id: req.params.guideId },
      include: {
        questMaster: { select: { id: true, name: true, displayName: true } },
        references: { orderBy: { sortOrder: "asc" } },
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            rows: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
              include: { outgoingLinks: { orderBy: { sortOrder: "asc" } } }
            }
          }
        }
      }
    });
    if (!guide) return res.status(404).json({ message: "攻略メモが見つかりません" });
    const strategyId = text(req.query.strategyId);
    let strategy = null;
    if (strategyId) {
      const found = await prisma.raidGuideStrategy.findFirst({
        where: {
          id: strategyId,
          guideId: guide.id,
          OR: [{ ownerId: userId(req) }, { visibility: "crew" }]
        },
        include: strategyInclude
      });
      if (!found) return res.status(404).json({ message: "対策メモが見つかりません" });
      strategy = serializeStrategy(found);
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ guide, strategy });
  } catch (error) {
    next(error);
  }
});

raidGuidesRouter.get("/:guideId", async (req, res, next) => {
  try {
    const guide = await prisma.raidGuide.findUnique({
      where: { id: req.params.guideId },
      include: {
        questMaster: { select: { id: true, name: true, displayName: true, element: true } },
        references: { orderBy: { sortOrder: "asc" } },
        strategies: {
          where: { OR: [{ ownerId: userId(req) }, { visibility: "crew" }] },
          include: strategyInclude,
          orderBy: { updatedAt: "desc" }
        }
      }
    });
    if (!guide) return res.status(404).json({ message: "攻略メモが見つかりません" });
    const strategies = guide.strategies.map(serializeStrategy);
    res.json({
      guide: { ...guide, strategies: undefined },
      ownStrategies: strategies.filter((strategy) => strategy.ownerId === userId(req)),
      crewStrategies: strategies.filter((strategy) => strategy.ownerId !== userId(req) && strategy.visibility === "crew")
    });
  } catch (error) {
    next(error);
  }
});

raidGuidesRouter.post("/:guideId/strategies", async (req, res, next) => {
  try {
    const guide = await prisma.raidGuide.findFirst({ where: { id: req.params.guideId, isActive: true } });
    if (!guide) return res.status(404).json({ message: "攻略メモが見つかりません" });
    const parsed = await validateStrategyInput(guide.id, req.body as Record<string, unknown>);
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });
    const value = parsed.value;
    const strategy = await prisma.$transaction(async (transaction) => {
      const used = await transaction.raidGuideStrategy.findMany({
        where: { guideId: guide.id, ownerId: userId(req) },
        select: { slotNumber: true }
      });
      const usedSlots = new Set(used.map((item) => item.slotNumber));
      const slotNumber = Array.from({ length: 10 }, (_, index) => index + 1).find((slot) => !usedSlots.has(slot));
      if (!slotNumber) return null;
      return transaction.raidGuideStrategy.create({
        data: {
          guideId: guide.id,
          ownerId: userId(req),
          title: value.title,
          overview: value.overview,
          visibility: value.visibility,
          buildPostId: value.buildPostId,
          slotNumber,
          stickyNotes: {
            create: value.stickyNotes.map((note, sortOrder) => ({ ...note, sortOrder }))
          }
        },
        include: strategyInclude
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!strategy) return res.status(409).json({ message: "この攻略メモには対策メモを10件まで作成できます" });
    res.status(201).json({ strategy: serializeStrategy(strategy) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
      return res.status(409).json({ message: "同時に更新されました。もう一度お試しください" });
    }
    next(error);
  }
});

raidGuideStrategiesRouter.put("/:strategyId", async (req, res, next) => {
  try {
    const existing = await prisma.raidGuideStrategy.findFirst({
      where: { id: req.params.strategyId, ownerId: userId(req) }
    });
    if (!existing) return res.status(404).json({ message: "対策メモが見つかりません" });
    const expectedUpdatedAt = parseDate(req.body.expectedUpdatedAt);
    if (!expectedUpdatedAt) return res.status(400).json({ message: "更新日時を確認してください" });
    const parsed = await validateStrategyInput(existing.guideId, req.body as Record<string, unknown>);
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });
    const value = parsed.value;
    const strategy = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.raidGuideStrategy.updateMany({
        where: { id: existing.id, ownerId: userId(req), updatedAt: expectedUpdatedAt },
        data: {
          title: value.title,
          overview: value.overview,
          visibility: value.visibility,
          buildPostId: value.buildPostId
        }
      });
      if (!updated.count) return null;
      await transaction.raidGuideStickyNote.deleteMany({ where: { strategyId: existing.id } });
      if (value.stickyNotes.length) {
        await transaction.raidGuideStickyNote.createMany({
          data: value.stickyNotes.map((note, sortOrder) => ({ strategyId: existing.id, ...note, sortOrder }))
        });
      }
      return transaction.raidGuideStrategy.findUnique({ where: { id: existing.id }, include: strategyInclude });
    });
    if (!strategy) return res.status(409).json({ message: "別の画面で更新されています。最新の内容を読み込んでください" });
    res.json({ strategy: serializeStrategy(strategy) });
  } catch (error) {
    next(error);
  }
});

raidGuideStrategiesRouter.delete("/:strategyId", async (req, res, next) => {
  try {
    const deleted = await prisma.raidGuideStrategy.deleteMany({
      where: { id: req.params.strategyId, ownerId: userId(req) }
    });
    if (!deleted.count) return res.status(404).json({ message: "対策メモが見つかりません" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { raidGuidesRouter, raidGuideStrategiesRouter };
