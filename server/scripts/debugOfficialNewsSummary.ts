import { prisma } from "../prisma.js";

async function main() {
  const [
    sourceArticleCount,
    categoryCount,
    extractedItemCount,
    fetchLogCount,
    latestArticles,
    latestExtractedItems,
    latestLogs,
  ] = await Promise.all([
    prisma.sourceArticle.count(),
    prisma.officialNewsCategory.count(),
    prisma.extractedNewsItem.count(),
    prisma.newsFetchLog.count(),
    prisma.sourceArticle.findMany({
      orderBy: [{ publishedAt: "desc" }, { lastCheckedAt: "desc" }],
      take: 5,
      select: {
        sourceArticleId: true,
        title: true,
        officialUrl: true,
        publishedAt: true,
        categoryIds: true,
        categorySlugs: true,
        articleType: true,
        contentHash: true,
        status: true,
      },
    }),
    prisma.extractedNewsItem.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 10,
      select: {
        sourceArticle: {
          select: {
            sourceArticleId: true,
            title: true,
            officialUrl: true,
          },
        },
        itemType: true,
        title: true,
        eventType: true,
        startsAt: true,
        endsAt: true,
        updateAtCandidate: true,
        rawDateText: true,
        summary: true,
        infoStatus: true,
        extractionConfidence: true,
        tags: true,
        relatedKey: true,
        displayPriority: true,
        isVisible: true,
      },
    }),
    prisma.newsFetchLog.findMany({
      orderBy: [{ startedAt: "desc" }],
      take: 5,
      select: {
        runType: true,
        targetPeriod: true,
        fetchedCount: true,
        insertedCount: true,
        updatedCount: true,
        failedCount: true,
        errorMessage: true,
        startedAt: true,
        finishedAt: true,
      },
    }),
  ]);

  console.log(JSON.stringify({
    counts: {
      sourceArticles: sourceArticleCount,
      officialNewsCategories: categoryCount,
      extractedNewsItems: extractedItemCount,
      newsFetchLogs: fetchLogCount,
    },
    latestArticles,
    latestExtractedItems,
    latestLogs,
    storagePolicyCheck: {
      sourceArticlesHasContentColumn: false,
      sourceArticlesHasHtmlColumn: false,
      sourceArticlesHasJsonColumn: false,
      sourceArticlesHasOfficialImageColumn: false,
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
