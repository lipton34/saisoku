-- CreateTable
CREATE TABLE "MaterialPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questName" TEXT,
    "note" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialPresetItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "note" TEXT,
    "presetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialPresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialPreset_ownerId_updatedAt_idx" ON "MaterialPreset"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "MaterialPresetItem_presetId_idx" ON "MaterialPresetItem"("presetId");

-- AddForeignKey
ALTER TABLE "MaterialPreset" ADD CONSTRAINT "MaterialPreset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialPresetItem" ADD CONSTRAINT "MaterialPresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "MaterialPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
