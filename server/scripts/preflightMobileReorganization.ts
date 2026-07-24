import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CountRow = {
  target: string;
  rowCount: bigint;
};

async function main() {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT 'tasks' AS target, COUNT(*) AS "rowCount" FROM "Task"
    UNION ALL
    SELECT 'material_goals', COUNT(*) FROM "MaterialGoal"
    UNION ALL
    SELECT 'material_items', COUNT(*) FROM "MaterialItem"
    UNION ALL
    SELECT 'material_presets', COUNT(*) FROM "MaterialPreset"
    UNION ALL
    SELECT 'material_preset_items', COUNT(*) FROM "MaterialPresetItem"
    UNION ALL
    SELECT 'build_posts', COUNT(*) FROM "BuildPost"
    UNION ALL
    SELECT 'build_post_images', COUNT(*) FROM "build_post_images"
    UNION ALL
    SELECT 'goal_build_links', COUNT(*) FROM "goal_build_links"
    UNION ALL
    SELECT 'goal_proposals', COUNT(*) FROM "goal_proposals"
    UNION ALL
    SELECT 'goals_deleted_by_status', COUNT(*) FROM "shared_goals"
      WHERE "boardStatus" IN ('next', 'paused', 'done')
    UNION ALL
    SELECT 'goals_preserved', COUNT(*) FROM "shared_goals"
      WHERE "boardStatus" IN ('now', 'later')
  `;

  console.table(rows.map((row) => ({ target: row.target, rowCount: row.rowCount.toString() })));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
