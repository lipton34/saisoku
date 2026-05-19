-- AlterTable
ALTER TABLE "guild_war_goal_plans" ADD COLUMN "targetMeatCount" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "guild_war_boss_speeds" ADD COLUMN "targetClearTimeSeconds" INTEGER,
ADD COLUMN "targetRuns" INTEGER NOT NULL DEFAULT 0;
