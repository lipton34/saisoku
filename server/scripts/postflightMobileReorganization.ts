import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CountRow = {
  target: string;
  rowCount: bigint;
};

type LegacyTableRow = {
  tableName: string;
};

async function main() {
  const counts = await prisma.$queryRaw<CountRow[]>`
    SELECT 'goals' AS target, COUNT(*) AS "rowCount" FROM "goals"
    UNION ALL
    SELECT 'round_goals', COUNT(*) FROM "round_goals"
    UNION ALL
    SELECT 'build_posts', COUNT(*) FROM "build_posts"
    UNION ALL
    SELECT 'build_post_images', COUNT(*) FROM "build_post_images"
    UNION ALL
    SELECT 'build_drafts', COUNT(*) FROM "build_drafts"
    UNION ALL
    SELECT 'build_draft_images', COUNT(*) FROM "build_draft_images"
  `;
  const legacyTables = await prisma.$queryRaw<LegacyTableRow[]>`
    SELECT tablename AS "tableName"
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'Task',
        'MaterialGoal',
        'MaterialItem',
        'MaterialPreset',
        'MaterialPresetItem',
        'BuildPost',
        'shared_goals',
        'goal_proposals',
        'goal_build_links'
      )
    ORDER BY tablename
  `;

  console.table(counts.map((row) => ({ target: row.target, rowCount: row.rowCount.toString() })));
  console.log(
    legacyTables.length === 0
      ? "旧テーブル残存: なし"
      : `旧テーブル残存: ${legacyTables.map((row) => row.tableName).join(", ")}`
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
