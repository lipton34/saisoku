-- Replace legacy goal sub-task rows with the new typed sub-task structure.
-- Existing goals, round goals, and progress goals are preserved.

DELETE FROM "goal_sub_tasks";
DELETE FROM "goal_required_items";
DELETE FROM "goal_raid_targets";

ALTER TABLE "goal_sub_tasks"
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN "source_round_goal_id" TEXT,
  ADD COLUMN "source_progress_goal_id" TEXT,
  ADD COLUMN "completion_override" BOOLEAN,
  ALTER COLUMN "title" DROP NOT NULL;

DROP INDEX "goal_sub_tasks_goalId_idx";

CREATE INDEX "goal_sub_tasks_goalId_sortOrder_idx"
  ON "goal_sub_tasks"("goalId", "sortOrder");
CREATE INDEX "goal_sub_tasks_source_round_goal_id_idx"
  ON "goal_sub_tasks"("source_round_goal_id");
CREATE INDEX "goal_sub_tasks_source_progress_goal_id_idx"
  ON "goal_sub_tasks"("source_progress_goal_id");
CREATE UNIQUE INDEX "goal_sub_tasks_goalId_source_round_goal_id_key"
  ON "goal_sub_tasks"("goalId", "source_round_goal_id");
CREATE UNIQUE INDEX "goal_sub_tasks_goalId_source_progress_goal_id_key"
  ON "goal_sub_tasks"("goalId", "source_progress_goal_id");

ALTER TABLE "goal_sub_tasks"
  ADD CONSTRAINT "goal_sub_tasks_source_round_goal_id_fkey"
  FOREIGN KEY ("source_round_goal_id") REFERENCES "round_goals"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "goal_sub_tasks_source_progress_goal_id_fkey"
  FOREIGN KEY ("source_progress_goal_id") REFERENCES "progress_goals"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "goal_sub_tasks_kind_check"
  CHECK (
    (
      "kind" = 'standard'
      AND "title" IS NOT NULL
      AND length(btrim("title")) BETWEEN 1 AND 100
      AND "source_round_goal_id" IS NULL
      AND "source_progress_goal_id" IS NULL
      AND "completion_override" IS NULL
    )
    OR (
      "kind" = 'round'
      AND "title" IS NULL
      AND "source_round_goal_id" IS NOT NULL
      AND "source_progress_goal_id" IS NULL
    )
    OR (
      "kind" = 'progress'
      AND "title" IS NULL
      AND "source_round_goal_id" IS NULL
      AND "source_progress_goal_id" IS NOT NULL
    )
  );

DROP TABLE "goal_required_items";
DROP TABLE "goal_raid_targets";
