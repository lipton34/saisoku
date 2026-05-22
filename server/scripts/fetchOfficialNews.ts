import { OfficialNewsService } from "../services/officialNews.js";
import { prisma } from "../prisma.js";

const usage = `
Usage:
  tsx server/scripts/fetchOfficialNews.ts latest [--max-pages N]
  tsx server/scripts/fetchOfficialNews.ts month YYYYMM [--max-pages N]
  tsx server/scripts/fetchOfficialNews.ts month YYYY-MM [--max-pages N]
  tsx server/scripts/fetchOfficialNews.ts reanalyze ARTICLE_ID
`;

async function main() {
  const [, , command, value, ...rest] = process.argv;
  const service = new OfficialNewsService();

  if (command === "latest") {
    const summary = await service.syncLatestNews({ maxPages: parseMaxPages([value, ...rest]) });
    printSummary("latest", summary);
    return;
  }

  if (command === "month") {
    if (!value) throw new Error(`month requires YYYYMM or YYYY-MM.\n${usage}`);
    const summary = await service.syncMonthlyArchive(value, { maxPages: parseMaxPages(rest) });
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
        fetchedPages: summary.fetchedPages,
        totalPageCnt: summary.totalPageCnt,
        maxPages: summary.maxPages,
        targetMonth: summary.targetMonth,
        errors: summary.errors,
      },
      null,
      2,
    ),
  );
}

function parseMaxPages(args: (string | undefined)[]) {
  const compact = args.filter((arg): arg is string => Boolean(arg));
  const flagIndex = compact.findIndex((arg) => arg === "--max-pages");
  if (flagIndex === -1) {
    return undefined;
  }

  const value = compact[flagIndex + 1];
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`--max-pages requires a positive integer.\n${usage}`);
  }

  return numberValue;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
