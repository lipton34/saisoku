import { PrismaClient } from "@prisma/client";
import { gbfMasterSeedItems, normalizeMasterAlias } from "../server/data/gbfMasterSeed/index.js";

const prisma = new PrismaClient();

async function seedGbfMasters() {
  for (const [index, item] of gbfMasterSeedItems.entries()) {
    const aliases = item.aliases ?? [];

    await prisma.gbfMasterItem.upsert({
      where: { id: item.id },
      update: {
        kind: item.kind,
        name: item.name,
        element: item.element ?? null,
        category: item.category ?? null,
        rarity: item.rarity ?? null,
        thumbnailPath: item.thumbnailPath ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        note: item.note ?? null,
        tags: item.tags ?? [],
        metadata: item.metadata ?? {},
        sortOrder: index,
        isActive: true
      },
      create: {
        id: item.id,
        kind: item.kind,
        name: item.name,
        element: item.element ?? null,
        category: item.category ?? null,
        rarity: item.rarity ?? null,
        thumbnailPath: item.thumbnailPath ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        note: item.note ?? null,
        tags: item.tags ?? [],
        metadata: item.metadata ?? {},
        sortOrder: index,
        isActive: true
      }
    });

    for (const alias of aliases) {
      const normalizedAlias = normalizeMasterAlias(alias);
      if (!normalizedAlias) {
        continue;
      }

      await prisma.gbfMasterAlias.upsert({
        where: {
          masterItemId_normalizedAlias: {
            masterItemId: item.id,
            normalizedAlias
          }
        },
        update: { alias },
        create: {
          masterItemId: item.id,
          alias,
          normalizedAlias
        }
      });
    }
  }
}

seedGbfMasters()
  .then(async () => {
    console.log(`Seeded ${gbfMasterSeedItems.length} GBF master items.`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
