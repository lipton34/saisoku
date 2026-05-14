CREATE TABLE "BuildPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "questName" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "overview" TEXT,
    "protagonistJob" TEXT,
    "characters" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "summons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "weapons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "requiredParts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recommendedParts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "substitutableParts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "freeSlots" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "substituteNotes" TEXT,
    "cautions" TEXT,
    "role" TEXT,
    "omenNotes" TEXT,
    "actionNotes" TEXT,
    "failurePoints" TEXT,
    "farmingGoal" TEXT,
    "raidRole" TEXT,
    "blueChest" TEXT,
    "clearTime" TEXT,
    "stability" TEXT,
    "prerequisites" TEXT,
    "weaponTarget" TEXT,
    "rescueTiming" TEXT,
    "farmingCautions" TEXT,
    "referenceUrls" JSONB NOT NULL DEFAULT '[]',
    "sourcePresetId" TEXT,
    "sourcePresetName" TEXT,
    "changeMemo" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuildPost_ownerId_updatedAt_idx" ON "BuildPost"("ownerId", "updatedAt");
CREATE INDEX "BuildPost_ownerId_category_questName_element_idx" ON "BuildPost"("ownerId", "category", "questName", "element");

ALTER TABLE "BuildPost" ADD CONSTRAINT "BuildPost_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
