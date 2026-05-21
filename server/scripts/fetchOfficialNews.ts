import { OfficialNewsService } from "../services/officialNews.js";
import { prisma } from "../prisma.js";

const usage = `
Usage:
  tsx server/scripts/fetchOfficialNews.ts latest
  tsx server/scripts/fetchOfficialNews.ts month YYYYMM
  tsx server/scripts/fetchOfficialNews.ts month YYYY-MM
  tsx server/scripts/fetchOfficialNews.ts reanalyze ARTICLE_ID
`;

async function main() {
  const [, , command, value] = process.argv;
  const service = new OfficialNewsService();

  if (command === "latest") {
    const summary = await service.syncLatestNews();
    printSummary("latest", summary);
    return;
  }

  if (command === "month") {
    if (!value) throw new Error(`month requires YYYYMM or YYYY-MM.\n${usage}`);
    const summary = await service.syncMonthlyArchive(value);
    printSummary(`month ${value}`, summary);
    return;
  }

  if (command === "reanalyze") {
    if (!value) throw new Error(`reanalyze requires ARTICLE_ID.\n${usage}`);
    const summary = await service.reanalyzeArticle(value);
    printSummary(`reanalyze ${value}`, summary);
    return;
  }

  throw new Error(usage);
}

function printSummary(label: string, summary: Awaited<ReturnType<OfficialNewsService["syncLatestNews"]>>) {
  console.log(
    JSON.stringify(
      {
        command: label,
        fetchedCount: summary.fetchedCount,
        insertedCount: summary.insertedCount,
        updatedCount: summary.updatedCount,
        failedCount: summary.failedCount,
        errors: summary.errors,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
