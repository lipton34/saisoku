import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

try {
  const [subTaskCount, requiredItemTable, raidTargetTable] = await Promise.all([
    prisma.goalSubTask.count(),
    prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT to_regclass('public.goal_required_items') IS NOT NULL AS "exists"
    `,
    prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT to_regclass('public.goal_raid_targets') IS NOT NULL AS "exists"
    `
  ]);
  console.log(`goal_sub_tasks: ${subTaskCount}`);
  console.log(`goal_required_items_exists: ${requiredItemTable[0]?.exists === true}`);
  console.log(`goal_raid_targets_exists: ${raidTargetTable[0]?.exists === true}`);
} finally {
  await prisma.$disconnect();
}
