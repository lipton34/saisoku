-- CreateTable
CREATE TABLE "MaterialGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "questName" TEXT,
    "note" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "ownedCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialGoal_ownerId_updatedAt_idx" ON "MaterialGoal"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "MaterialItem_goalId_idx" ON "MaterialItem"("goalId");

-- AddForeignKey
ALTER TABLE "MaterialGoal" ADD CONSTRAINT "MaterialGoal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialItem" ADD CONSTRAINT "MaterialItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MaterialGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
