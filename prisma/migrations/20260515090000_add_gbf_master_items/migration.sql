CREATE TYPE "GbfMasterKind" AS ENUM ('character', 'weapon', 'summon', 'job', 'material', 'quest');

CREATE TABLE "gbf_master_items" (
    "id" TEXT NOT NULL,
    "kind" "GbfMasterKind" NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "element" TEXT,
    "rarity" TEXT,
    "category" TEXT,
    "thumbnailPath" TEXT,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "note" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gbf_master_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gbf_master_aliases" (
    "id" TEXT NOT NULL,
    "masterItemId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gbf_master_aliases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gbf_master_items_kind_isActive_sortOrder_idx" ON "gbf_master_items"("kind", "isActive", "sortOrder");
CREATE INDEX "gbf_master_items_kind_name_idx" ON "gbf_master_items"("kind", "name");
CREATE UNIQUE INDEX "gbf_master_aliases_masterItemId_normalizedAlias_key" ON "gbf_master_aliases"("masterItemId", "normalizedAlias");
CREATE INDEX "gbf_master_aliases_normalizedAlias_idx" ON "gbf_master_aliases"("normalizedAlias");

ALTER TABLE "gbf_master_aliases" ADD CONSTRAINT "gbf_master_aliases_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "gbf_master_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
