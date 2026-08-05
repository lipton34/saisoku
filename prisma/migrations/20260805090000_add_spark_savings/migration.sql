CREATE TABLE "spark_savings" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "crystal_count" INTEGER NOT NULL DEFAULT 0,
  "single_ticket_count" INTEGER NOT NULL DEFAULT 0,
  "ten_pull_ticket_count" INTEGER NOT NULL DEFAULT 0,
  "target_name" TEXT,
  "planned_at" DATE,
  "memo" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_savings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "spark_savings_crystal_count_check" CHECK ("crystal_count" BETWEEN 0 AND 999999999),
  CONSTRAINT "spark_savings_single_ticket_count_check" CHECK ("single_ticket_count" BETWEEN 0 AND 999999),
  CONSTRAINT "spark_savings_ten_pull_ticket_count_check" CHECK ("ten_pull_ticket_count" BETWEEN 0 AND 99999),
  CONSTRAINT "spark_savings_target_name_length_check" CHECK ("target_name" IS NULL OR char_length("target_name") <= 100),
  CONSTRAINT "spark_savings_memo_length_check" CHECK ("memo" IS NULL OR char_length("memo") <= 2000)
);

CREATE UNIQUE INDEX "spark_savings_owner_id_key" ON "spark_savings"("owner_id");

ALTER TABLE "spark_savings"
ADD CONSTRAINT "spark_savings_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
