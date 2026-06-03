-- AlterTable
ALTER TABLE "shared_goals"
ADD COLUMN "boardStatus" TEXT NOT NULL DEFAULT 'later',
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN "effort" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "beginnerRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "shared_goals_ownerId_boardStatus_sortOrder_idx" ON "shared_goals"("ownerId", "boardStatus", "sortOrder");

-- CreateIndex
CREATE INDEX "shared_goals_priority_idx" ON "shared_goals"("priority");

-- CreateIndex
CREATE INDEX "shared_goals_effort_idx" ON "shared_goals"("effort");
