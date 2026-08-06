import { PrismaClient } from "@prisma/client";
import { gbfMasterSeedItems, normalizeMasterAlias } from "../server/data/gbfMasterSeed/index.js";
import { raidGuideMasterDefinitions, validateRaidGuideMasterDefinitions } from "../server/data/raidGuideMasters.js";
import { availabilityPeriodIdsForMaster, sparkAvailabilityPeriodDefinitions } from "../server/data/sparkAvailabilityPeriods.js";

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
        isActive: item.isActive ?? true
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
        isActive: item.isActive ?? true
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

async function seedSparkAvailabilityPeriods() {
  const seedUser = await prisma.user.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true } });
  if (!seedUser) {
    console.warn("Skipped spark availability periods because no user exists yet.");
    return;
  }
  for (const definition of sparkAvailabilityPeriodDefinitions) {
    await prisma.sparkAvailabilityPeriod.upsert({
      where: { id: definition.id },
      // Shared masters remain user-editable; later seed runs must not overwrite edits.
      update: {},
      create: { ...definition, isActive: true, createdById: seedUser.id, updatedById: seedUser.id },
    });
  }
  let linkedMasterCount = 0;
  for (const item of gbfMasterSeedItems) {
    const periodIds = availabilityPeriodIdsForMaster(item);
    if (!periodIds.length) continue;
    linkedMasterCount += 1;
    await prisma.gbfMasterAvailabilityLink.deleteMany({ where: { masterItemId: item.id } });
    await prisma.gbfMasterAvailabilityLink.createMany({
      data: periodIds.map((availabilityPeriodId, sortOrder) => ({ masterItemId: item.id, availabilityPeriodId, sortOrder })),
    });
  }
  console.log(`Seeded ${sparkAvailabilityPeriodDefinitions.length} spark availability periods and linked ${linkedMasterCount} GBF masters.`);
}

async function seedRaidGuides() {
  validateRaidGuideMasterDefinitions();
  for (const [guideIndex, guide] of raidGuideMasterDefinitions.entries()) {
    await prisma.raidGuide.upsert({
      where: { id: guide.id },
      update: {
        questMasterId: guide.questMasterId,
        title: guide.title,
        overview: guide.overview,
        revision: guide.revision,
        sortOrder: guideIndex,
        isActive: guide.isActive
      },
      create: {
        id: guide.id,
        questMasterId: guide.questMasterId,
        title: guide.title,
        overview: guide.overview,
        revision: guide.revision,
        sortOrder: guideIndex,
        isActive: guide.isActive
      }
    });

    // New sections or rows may be inserted before existing master records. Move
    // current orders out of the target range first to avoid unique collisions.
    await prisma.raidGuideSection.updateMany({
      where: { guideId: guide.id, sortOrder: { lt: 1000 } },
      data: { sortOrder: { increment: 1000 }, isActive: false }
    });
    await prisma.raidGuideRow.updateMany({
      where: { guideId: guide.id },
      data: { isActive: false }
    });
    for (const [sourceId, targetId] of Object.entries(guide.rowRedirects ?? {})) {
      await prisma.raidGuideStickyNote.updateMany({
        where: { strategy: { guideId: guide.id }, guideRowId: sourceId },
        data: { guideRowId: targetId }
      });
    }

    for (const [sectionIndex, section] of guide.sections.entries()) {
      await prisma.raidGuideSection.upsert({
        where: { id: section.id },
        update: { guideId: guide.id, title: section.title, sortOrder: sectionIndex, isActive: true },
        create: { id: section.id, guideId: guide.id, title: section.title, sortOrder: sectionIndex, isActive: true }
      });
      await prisma.raidGuideRow.updateMany({
        where: { sectionId: section.id, sortOrder: { lt: 1000 } },
        data: { sortOrder: { increment: 1000 } }
      });
      for (const [rowIndex, row] of section.rows.entries()) {
        await prisma.raidGuideRow.upsert({
          where: { id: row.id },
          update: {
            guideId: guide.id,
            sectionId: section.id,
            timingCondition: row.timingCondition,
            enemyAction: row.enemyAction,
            requiredResponse: row.requiredResponse,
            supplementalNote: row.supplementalNote ?? null,
            pageType: row.pageType ?? "guide",
            dangerLevel: row.dangerLevel,
            sortOrder: rowIndex,
            isActive: true
          },
          create: {
            id: row.id,
            guideId: guide.id,
            sectionId: section.id,
            timingCondition: row.timingCondition,
            enemyAction: row.enemyAction,
            requiredResponse: row.requiredResponse,
            supplementalNote: row.supplementalNote ?? null,
            pageType: row.pageType ?? "guide",
            dangerLevel: row.dangerLevel,
            sortOrder: rowIndex,
            isActive: true
          }
        });
      }
    }

    for (const [referenceIndex, reference] of guide.references.entries()) {
      await prisma.raidGuideReference.upsert({
        where: { id: reference.id },
        update: { guideId: guide.id, label: reference.label, url: reference.url, sortOrder: referenceIndex },
        create: { id: reference.id, guideId: guide.id, label: reference.label, url: reference.url, sortOrder: referenceIndex }
      });
    }
  }
}

seedGbfMasters()
  .then(seedSparkAvailabilityPeriods)
  .then(seedRaidGuides)
  .then(async () => {
    console.log(`Seeded ${gbfMasterSeedItems.length} GBF master items and ${raidGuideMasterDefinitions.length} raid guides.`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
