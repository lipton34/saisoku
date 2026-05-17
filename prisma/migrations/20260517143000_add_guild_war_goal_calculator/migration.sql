-- CreateTable
CREATE TABLE "guild_war_goal_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetContribution" BIGINT NOT NULL DEFAULT 0,
    "memo" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_war_goal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_war_goal_days" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "targetContribution" BIGINT NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL,
    "memo" TEXT,

    CONSTRAINT "guild_war_goal_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_war_boss_masters" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "bossLevel" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contribution" BIGINT NOT NULL,
    "meatCost" INTEGER NOT NULL DEFAULT 0,
    "specialMeatCost" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_war_boss_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_war_boss_speeds" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "bossLevel" INTEGER NOT NULL,
    "clearTimeSeconds" INTEGER,
    "playStyle" TEXT NOT NULL DEFAULT '未指定',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_war_boss_speeds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guild_war_goal_plans_ownerId_updatedAt_idx" ON "guild_war_goal_plans"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "guild_war_goal_days_planId_sortOrder_key" ON "guild_war_goal_days"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "guild_war_goal_days_planId_idx" ON "guild_war_goal_days"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_war_boss_masters_eventKey_bossLevel_key" ON "guild_war_boss_masters"("eventKey", "bossLevel");

-- CreateIndex
CREATE INDEX "guild_war_boss_masters_eventKey_isEnabled_bossLevel_idx" ON "guild_war_boss_masters"("eventKey", "isEnabled", "bossLevel");

-- CreateIndex
CREATE UNIQUE INDEX "guild_war_boss_speeds_planId_bossLevel_key" ON "guild_war_boss_speeds"("planId", "bossLevel");

-- CreateIndex
CREATE INDEX "guild_war_boss_speeds_planId_idx" ON "guild_war_boss_speeds"("planId");

-- AddForeignKey
ALTER TABLE "guild_war_goal_plans" ADD CONSTRAINT "guild_war_goal_plans_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_war_goal_days" ADD CONSTRAINT "guild_war_goal_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "guild_war_goal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_war_boss_speeds" ADD CONSTRAINT "guild_war_boss_speeds_planId_fkey" FOREIGN KEY ("planId") REFERENCES "guild_war_goal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
