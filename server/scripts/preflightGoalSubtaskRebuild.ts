import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

type CountRow = { target: string; row_count: bigint };

try {
  const counts = await prisma.$queryRaw<CountRow[]>`
    SELECT 'goal_sub_tasks' AS target, COUNT(*) AS row_count FROM "goal_sub_tasks"
    UNION ALL
    SELECT 'goal_sub_tasks_done', COUNT(*) FROM "goal_sub_tasks" WHERE "isDone" = true
    UNION ALL
    SELECT 'goal_sub_tasks_open', COUNT(*) FROM "goal_sub_tasks" WHERE "isDone" = false
    UNION ALL
    SELECT 'goals_with_sub_tasks', COUNT(DISTINCT "goalId") FROM "goal_sub_tasks"
    UNION ALL
    SELECT 'goal_required_items', COUNT(*) FROM "goal_required_items"
    UNION ALL
    SELECT 'goals_with_required_items', COUNT(DISTINCT "goalId") FROM "goal_required_items"
    UNION ALL
    SELECT 'goal_raid_targets', COUNT(*) FROM "goal_raid_targets"
    UNION ALL
    SELECT 'goals_with_raid_targets', COUNT(DISTINCT "goalId") FROM "goal_raid_targets"
  `;
  for (const row of counts) {
    console.log(`${row.target}: ${row.row_count.toString()}`);
  }
} finally {
  await prisma.$disconnect();
}
