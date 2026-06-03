-- CreateTable
CREATE TABLE "goal_build_links" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_build_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_required_items" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "masterItemId" TEXT,
    "itemKind" TEXT NOT NULL DEFAULT 'weapon',
    "name" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "importance" TEXT NOT NULL DEFAULT '必須',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_required_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_raid_targets" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "questName" TEXT NOT NULL,
    "runType" TEXT NOT NULL DEFAULT 'other',
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_raid_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_sub_tasks" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_sub_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_build_links_goalId_buildId_key" ON "goal_build_links"("goalId", "buildId");

-- CreateIndex
CREATE INDEX "goal_build_links_goalId_idx" ON "goal_build_links"("goalId");

-- CreateIndex
CREATE INDEX "goal_build_links_buildId_idx" ON "goal_build_links"("buildId");

-- CreateIndex
CREATE INDEX "goal_required_items_goalId_idx" ON "goal_required_items"("goalId");

-- CreateIndex
CREATE INDEX "goal_required_items_masterItemId_idx" ON "goal_required_items"("masterItemId");

-- CreateIndex
CREATE INDEX "goal_raid_targets_goalId_idx" ON "goal_raid_targets"("goalId");

-- CreateIndex
CREATE INDEX "goal_sub_tasks_goalId_idx" ON "goal_sub_tasks"("goalId");

-- AddForeignKey
ALTER TABLE "goal_build_links" ADD CONSTRAINT "goal_build_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "shared_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_build_links" ADD CONSTRAINT "goal_build_links_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "BuildPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_required_items" ADD CONSTRAINT "goal_required_items_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "shared_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_required_items" ADD CONSTRAINT "goal_required_items_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "gbf_master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_raid_targets" ADD CONSTRAINT "goal_raid_targets_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "shared_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_sub_tasks" ADD CONSTRAINT "goal_sub_tasks_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "shared_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
