CREATE TABLE "progress_goals" (
  "id" TEXT NOT NULL,
  "preset_id" TEXT NOT NULL,
  "preset_version" INTEGER NOT NULL,
  "preset_name" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "target_name" TEXT NOT NULL,
  "selection" JSONB NOT NULL DEFAULT '{}',
  "goal_stage_id" TEXT NOT NULL,
  "starting_stage_id" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "progress_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_item_inventories" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "item_key" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "owned_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_item_inventories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_progress_shared_values" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "value_key" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_progress_shared_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "progress_stage_progresses" (
  "id" TEXT NOT NULL,
  "goal_id" TEXT NOT NULL,
  "stage_id" TEXT NOT NULL,
  "is_manually_done" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "progress_stage_progresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "progress_condition_progresses" (
  "id" TEXT NOT NULL,
  "goal_id" TEXT NOT NULL,
  "condition_id" TEXT NOT NULL,
  "is_checked" BOOLEAN NOT NULL DEFAULT false,
  "numeric_value" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "progress_condition_progresses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_item_inventories_owner_id_item_key_key" ON "user_item_inventories"("owner_id", "item_key");
CREATE UNIQUE INDEX "user_progress_shared_values_owner_id_value_key_key" ON "user_progress_shared_values"("owner_id", "value_key");
CREATE UNIQUE INDEX "progress_stage_progresses_goal_id_stage_id_key" ON "progress_stage_progresses"("goal_id", "stage_id");
CREATE UNIQUE INDEX "progress_condition_progresses_goal_id_condition_id_key" ON "progress_condition_progresses"("goal_id", "condition_id");
CREATE INDEX "progress_goals_owner_id_updated_at_idx" ON "progress_goals"("owner_id", "updated_at");
CREATE INDEX "progress_goals_owner_id_preset_id_target_id_goal_stage_id_idx" ON "progress_goals"("owner_id", "preset_id", "target_id", "goal_stage_id");
CREATE INDEX "user_item_inventories_owner_id_item_name_idx" ON "user_item_inventories"("owner_id", "item_name");
CREATE INDEX "progress_stage_progresses_goal_id_idx" ON "progress_stage_progresses"("goal_id");
CREATE INDEX "progress_condition_progresses_goal_id_idx" ON "progress_condition_progresses"("goal_id");
ALTER TABLE "progress_goals" ADD CONSTRAINT "progress_goals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_item_inventories" ADD CONSTRAINT "user_item_inventories_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_progress_shared_values" ADD CONSTRAINT "user_progress_shared_values_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress_stage_progresses" ADD CONSTRAINT "progress_stage_progresses_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "progress_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress_condition_progresses" ADD CONSTRAINT "progress_condition_progresses_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "progress_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
