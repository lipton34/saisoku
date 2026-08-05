ALTER TABLE "spark_savings"
  DROP COLUMN "target_name",
  DROP COLUMN "planned_at",
  DROP COLUMN "memo",
  ADD COLUMN "history_started_at" TIMESTAMP(3),
  ADD COLUMN "history_summary_start_month" DATE;

CREATE TABLE "spark_savings_histories" (
  "id" TEXT PRIMARY KEY, "owner_id" TEXT NOT NULL, "savings_id" TEXT NOT NULL,
  "entry_type" TEXT NOT NULL, "crystal_delta" INTEGER NOT NULL DEFAULT 0,
  "single_ticket_delta" INTEGER NOT NULL DEFAULT 0, "ten_pull_ticket_delta" INTEGER NOT NULL DEFAULT 0,
  "crystal_balance" INTEGER NOT NULL, "single_ticket_balance" INTEGER NOT NULL,
  "ten_pull_ticket_balance" INTEGER NOT NULL, "title" TEXT NOT NULL, "memo" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "spark_history_type_check" CHECK ("entry_type" IN ('start','earn','spend','adjustment')),
  CONSTRAINT "spark_history_title_check" CHECK (char_length("title") BETWEEN 1 AND 100),
  CONSTRAINT "spark_history_memo_check" CHECK ("memo" IS NULL OR char_length("memo") <= 500),
  CONSTRAINT "spark_history_balances_check" CHECK ("crystal_balance" >= 0 AND "single_ticket_balance" >= 0 AND "ten_pull_ticket_balance" >= 0),
  FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("savings_id") REFERENCES "spark_savings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "spark_savings_histories_owner_id_created_at_idx" ON "spark_savings_histories"("owner_id", "created_at");
CREATE INDEX "spark_savings_histories_savings_id_created_at_idx" ON "spark_savings_histories"("savings_id", "created_at");

CREATE TABLE "spark_availability_periods" (
  "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL, "display_label" TEXT NOT NULL,
  "start_month" INTEGER, "start_part" TEXT, "end_month" INTEGER, "end_part" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true, "created_by_id" TEXT NOT NULL, "updated_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_availability_kind_check" CHECK ("kind" IN ('annual','permanent','irregular')),
  CONSTRAINT "spark_availability_label_check" CHECK (char_length("display_label") BETWEEN 1 AND 100),
  CONSTRAINT "spark_availability_month_check" CHECK (("start_month" IS NULL OR "start_month" BETWEEN 1 AND 12) AND ("end_month" IS NULL OR "end_month" BETWEEN 1 AND 12)),
  CONSTRAINT "spark_availability_part_check" CHECK (("start_part" IS NULL OR "start_part" IN ('early','middle','late')) AND ("end_part" IS NULL OR "end_part" IN ('early','middle','late'))),
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "spark_availability_periods_is_active_display_label_idx" ON "spark_availability_periods"("is_active", "display_label");

CREATE TABLE "spark_targets" (
  "id" TEXT PRIMARY KEY, "owner_id" TEXT NOT NULL, "item_type" TEXT NOT NULL, "name" TEXT NOT NULL,
  "master_item_id" TEXT, "desired_count" INTEGER NOT NULL DEFAULT 1, "owned_count" INTEGER NOT NULL DEFAULT 0,
  "availability_period_id" TEXT, "note" TEXT, "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_target_type_check" CHECK ("item_type" IN ('character','summon','weapon')),
  CONSTRAINT "spark_target_name_check" CHECK (char_length("name") BETWEEN 1 AND 100),
  CONSTRAINT "spark_target_counts_check" CHECK ("desired_count" BETWEEN 1 AND 999 AND "owned_count" BETWEEN 0 AND 999),
  CONSTRAINT "spark_target_note_check" CHECK ("note" IS NULL OR char_length("note") <= 500),
  FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("master_item_id") REFERENCES "gbf_master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("availability_period_id") REFERENCES "spark_availability_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "spark_targets_owner_id_sort_order_idx" ON "spark_targets"("owner_id", "sort_order");
CREATE INDEX "spark_targets_master_item_id_idx" ON "spark_targets"("master_item_id");
CREATE INDEX "spark_targets_availability_period_id_idx" ON "spark_targets"("availability_period_id");

CREATE TABLE "spark_target_goal_links" (
  "id" TEXT PRIMARY KEY, "target_id" TEXT NOT NULL, "goal_id" TEXT NOT NULL, "sort_order" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("target_id") REFERENCES "spark_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "spark_target_goal_links_target_id_goal_id_key" ON "spark_target_goal_links"("target_id", "goal_id");
CREATE INDEX "spark_target_goal_links_goal_id_idx" ON "spark_target_goal_links"("goal_id");
CREATE TABLE "spark_target_build_links" (
  "id" TEXT PRIMARY KEY, "target_id" TEXT NOT NULL, "build_post_id" TEXT NOT NULL, "sort_order" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("target_id") REFERENCES "spark_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("build_post_id") REFERENCES "build_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "spark_target_build_links_target_id_build_post_id_key" ON "spark_target_build_links"("target_id", "build_post_id");
CREATE INDEX "spark_target_build_links_build_post_id_idx" ON "spark_target_build_links"("build_post_id");

CREATE TABLE "spark_reward_event_types" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "aggregation_kind" TEXT NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0, "created_by_id" TEXT NOT NULL, "updated_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_reward_event_kind_check" CHECK ("aggregation_kind" IN ('scheduled','monthlyBaseline')),
  CONSTRAINT "spark_reward_event_name_check" CHECK (char_length("name") BETWEEN 1 AND 100),
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "spark_reward_event_types_is_active_sort_order_idx" ON "spark_reward_event_types"("is_active", "sort_order");

CREATE TABLE "spark_reward_records" (
  "id" TEXT PRIMARY KEY, "event_type_id" TEXT NOT NULL, "year" INTEGER NOT NULL, "month" INTEGER NOT NULL,
  "occurrence_name" TEXT NOT NULL, "started_on" DATE, "crystal_count" INTEGER NOT NULL DEFAULT 0,
  "single_ticket_count" INTEGER NOT NULL DEFAULT 0, "ten_pull_ticket_count" INTEGER NOT NULL DEFAULT 0,
  "is_included" BOOLEAN NOT NULL DEFAULT true, "evidence_memo" TEXT, "reference_url" TEXT,
  "created_by_id" TEXT NOT NULL, "updated_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_reward_record_date_check" CHECK ("year" BETWEEN 2000 AND 2100 AND "month" BETWEEN 1 AND 12),
  CONSTRAINT "spark_reward_record_name_check" CHECK (char_length("occurrence_name") BETWEEN 1 AND 150),
  CONSTRAINT "spark_reward_record_counts_check" CHECK ("crystal_count" BETWEEN 0 AND 999999999 AND "single_ticket_count" BETWEEN 0 AND 999999 AND "ten_pull_ticket_count" BETWEEN 0 AND 99999),
  CONSTRAINT "spark_reward_record_memo_check" CHECK ("evidence_memo" IS NULL OR char_length("evidence_memo") <= 1000),
  FOREIGN KEY ("event_type_id") REFERENCES "spark_reward_event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "spark_reward_records_year_month_is_included_idx" ON "spark_reward_records"("year", "month", "is_included");
CREATE INDEX "spark_reward_records_event_type_id_year_month_idx" ON "spark_reward_records"("event_type_id", "year", "month");

CREATE TABLE "spark_reward_schedules" (
  "id" TEXT PRIMARY KEY, "event_type_id" TEXT NOT NULL, "name" TEXT NOT NULL, "started_on" DATE NOT NULL,
  "ended_on" DATE, "memo" TEXT, "created_by_id" TEXT NOT NULL, "updated_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_reward_schedule_name_check" CHECK (char_length("name") BETWEEN 1 AND 150),
  CONSTRAINT "spark_reward_schedule_range_check" CHECK ("ended_on" IS NULL OR "ended_on" >= "started_on"),
  CONSTRAINT "spark_reward_schedule_memo_check" CHECK ("memo" IS NULL OR char_length("memo") <= 500),
  FOREIGN KEY ("event_type_id") REFERENCES "spark_reward_event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "spark_reward_schedules_started_on_idx" ON "spark_reward_schedules"("started_on");
CREATE INDEX "spark_reward_schedules_event_type_id_started_on_idx" ON "spark_reward_schedules"("event_type_id", "started_on");

CREATE TABLE "spark_reward_month_statuses" (
  "id" TEXT PRIMARY KEY, "year" INTEGER NOT NULL, "month" INTEGER NOT NULL, "is_complete" BOOLEAN NOT NULL DEFAULT false,
  "updated_by_id" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spark_reward_month_status_date_check" CHECK ("year" BETWEEN 2000 AND 2100 AND "month" BETWEEN 1 AND 12),
  FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "spark_reward_month_statuses_year_month_key" ON "spark_reward_month_statuses"("year", "month");

CREATE TABLE "spark_shared_audit_logs" (
  "id" TEXT PRIMARY KEY, "actor_id" TEXT, "actor_label" TEXT NOT NULL, "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL, "action" TEXT NOT NULL, "before_data" JSONB, "after_data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "spark_shared_audit_logs_entity_type_entity_id_created_at_idx" ON "spark_shared_audit_logs"("entity_type", "entity_id", "created_at");
