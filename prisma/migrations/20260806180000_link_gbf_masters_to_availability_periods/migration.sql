CREATE TABLE "gbf_master_availability_links" (
    "id" TEXT NOT NULL,
    "master_item_id" TEXT NOT NULL,
    "availability_period_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gbf_master_availability_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gbf_master_availability_links_master_item_id_availability_period_id_key"
ON "gbf_master_availability_links"("master_item_id", "availability_period_id");

CREATE INDEX "gbf_master_availability_links_availability_period_id_idx"
ON "gbf_master_availability_links"("availability_period_id");

ALTER TABLE "gbf_master_availability_links"
ADD CONSTRAINT "gbf_master_availability_links_master_item_id_fkey"
FOREIGN KEY ("master_item_id") REFERENCES "gbf_master_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gbf_master_availability_links"
ADD CONSTRAINT "gbf_master_availability_links_availability_period_id_fkey"
FOREIGN KEY ("availability_period_id") REFERENCES "spark_availability_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
