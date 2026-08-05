CREATE TABLE "spark_target_availability_links" (
  "id" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "availability_period_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "spark_target_availability_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "spark_target_availability_links_target_id_fkey"
    FOREIGN KEY ("target_id") REFERENCES "spark_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "spark_target_availability_links_availability_period_id_fkey"
    FOREIGN KEY ("availability_period_id") REFERENCES "spark_availability_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "spark_target_availability_links_target_id_availability_period_id_key"
  ON "spark_target_availability_links"("target_id", "availability_period_id");
CREATE INDEX "spark_target_availability_links_availability_period_id_idx"
  ON "spark_target_availability_links"("availability_period_id");

INSERT INTO "spark_target_availability_links" ("id", "target_id", "availability_period_id", "sort_order")
SELECT 'stav_' || md5("id" || ':' || "availability_period_id"), "id", "availability_period_id", 0
FROM "spark_targets"
WHERE "availability_period_id" IS NOT NULL;

ALTER TABLE "spark_targets" DROP CONSTRAINT "spark_targets_availability_period_id_fkey";
DROP INDEX "spark_targets_availability_period_id_idx";
ALTER TABLE "spark_targets" DROP COLUMN "availability_period_id";
