import { Router } from "express";
import { GbfMasterKind, Prisma } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

const buildMasterKinds = new Set<GbfMasterKind>([
  GbfMasterKind.character,
  GbfMasterKind.weapon,
  GbfMasterKind.summon,
  GbfMasterKind.job,
  GbfMasterKind.material,
  GbfMasterKind.quest,
]);

function optionalQueryText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseKinds(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((kind) => kind.trim())
    .filter((kind): kind is GbfMasterKind => buildMasterKinds.has(kind as GbfMasterKind));
}

function parseLimit(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) {
    return undefined;
  }

  return Math.min(limit, 100);
}

function parseOffset(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const offset = Number(value);
  if (!Number.isInteger(offset) || offset < 0) {
    return undefined;
  }

  return offset;
}

router.get("/", async (req, res, next) => {
  try {
    const kinds = parseKinds(req.query.kind);
    const element = optionalQueryText(req.query.element);
    const query = optionalQueryText(req.query.query);
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const and: Prisma.GbfMasterItemWhereInput[] = [];

    if (kinds.length > 0) {
      and.push({ kind: { in: kinds } });
    }

    if (element) {
      and.push({
        OR: [
          { element },
          { tags: { has: element } },
        ],
      });
    }

    if (query) {
      and.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { rarity: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
          {
            aliases: {
              some: {
                OR: [
                  { alias: { contains: query, mode: "insensitive" } },
                  { normalizedAlias: { contains: query.toLocaleLowerCase("ja-JP"), mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      });
    }

    const where: Prisma.GbfMasterItemWhereInput = {
      isActive: true,
      ...(and.length > 0 ? { AND: and } : {}),
    };

    const items = await prisma.gbfMasterItem.findMany({
      where,
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      ...(limit ? { take: limit } : {}),
      ...(offset ? { skip: offset } : {}),
      select: {
        id: true,
        kind: true,
        name: true,
        displayName: true,
        element: true,
        rarity: true,
        category: true,
        thumbnailPath: true,
        thumbnailUrl: true,
        description: true,
        note: true,
        tags: true,
        metadata: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true
      }
    });

    const itemIds = items.map((item) => item.id);
    const aliases = await prisma.gbfMasterAlias.findMany({
      where: {
        masterItemId: { in: itemIds },
      },
      orderBy: [{ alias: "asc" }],
      select: {
        id: true,
        masterItemId: true,
        alias: true,
        normalizedAlias: true
      }
    });

    res.json({ items, aliases });
  } catch (error) {
    next(error);
  }
});

export { router as buildMastersRouter };
