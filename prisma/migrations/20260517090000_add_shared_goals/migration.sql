-- CreateTable
CREATE TABLE "shared_goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "unit" TEXT,
    "progressRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT '未着手',
    "dueDate" TIMESTAMP(3),
    "memo" TEXT,
    "sourceProposalId" TEXT,
    "proposedByUserId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_proposals" (
    "id" TEXT NOT NULL,
    "proposerUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "unit" TEXT,
    "dueDate" TIMESTAMP(3),
    "proposalMemo" TEXT,
    "status" TEXT NOT NULL DEFAULT '提案中',
    "acceptedGoalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_goals_sourceProposalId_key" ON "shared_goals"("sourceProposalId");

-- CreateIndex
CREATE INDEX "shared_goals_ownerId_status_idx" ON "shared_goals"("ownerId", "status");

-- CreateIndex
CREATE INDEX "shared_goals_category_status_idx" ON "shared_goals"("category", "status");

-- CreateIndex
CREATE INDEX "shared_goals_dueDate_idx" ON "shared_goals"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "goal_proposals_acceptedGoalId_key" ON "goal_proposals"("acceptedGoalId");

-- CreateIndex
CREATE INDEX "goal_proposals_targetUserId_status_idx" ON "goal_proposals"("targetUserId", "status");

-- CreateIndex
CREATE INDEX "goal_proposals_proposerUserId_status_idx" ON "goal_proposals"("proposerUserId", "status");

-- AddForeignKey
ALTER TABLE "shared_goals" ADD CONSTRAINT "shared_goals_sourceProposalId_fkey" FOREIGN KEY ("sourceProposalId") REFERENCES "goal_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_goals" ADD CONSTRAINT "shared_goals_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_goals" ADD CONSTRAINT "shared_goals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_proposals" ADD CONSTRAINT "goal_proposals_proposerUserId_fkey" FOREIGN KEY ("proposerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_proposals" ADD CONSTRAINT "goal_proposals_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_proposals" ADD CONSTRAINT "goal_proposals_acceptedGoalId_fkey" FOREIGN KEY ("acceptedGoalId") REFERENCES "shared_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
