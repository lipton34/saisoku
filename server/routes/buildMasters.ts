import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.gbfMasterItem.findMany({
      where: { isActive: true },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
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

    const aliases = await prisma.gbfMasterAlias.findMany({
      where: { masterItem: { isActive: true } },
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
