-- Preserve only the existing "now" and "later" goals. All other legacy goals,
-- proposals, tasks, material goals, and builds are intentionally removed.

ALTER TABLE "goal_required_items" DROP CONSTRAINT "goal_required_items_goalId_fkey";
ALTER TABLE "goal_raid_targets" DROP CONSTRAINT "goal_raid_targets_goalId_fkey";
ALTER TABLE "goal_sub_tasks" DROP CONSTRAINT "goal_sub_tasks_goalId_fkey";
ALTER TABLE "shared_goals" DROP CONSTRAINT "shared_goals_sourceProposalId_fkey";
ALTER TABLE "goal_proposals" DROP CONSTRAINT "goal_proposals_acceptedGoalId_fkey";

DELETE FROM "goal_required_items"
WHERE "goalId" IN (
  SELECT "id" FROM "shared_goals" WHERE "boardStatus" NOT IN ('now', 'later')
);
DELETE FROM "goal_raid_targets"
WHERE "goalId" IN (
  SELECT "id" FROM "shared_goals" WHERE "boardStatus" NOT IN ('now', 'later')
);
DELETE FROM "goal_sub_tasks"
WHERE "goalId" IN (
  SELECT "id" FROM "shared_goals" WHERE "boardStatus" NOT IN ('now', 'later')
);

CREATE TABLE "round_goals" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "target_count" INTEGER NOT NULL,
  "current_count" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "round_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goals" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "memo" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'personal',
  "board_status" TEXT NOT NULL DEFAULT 'unset',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "owner_id" TEXT NOT NULL,
  "source_round_goal_id" TEXT,
  "source_progress_goal_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

INSERT INTO "goals" (
  "id",
  "title",
  "description",
  "memo",
  "visibility",
  "board_status",
  "sort_order",
  "owner_id",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "title",
  "description",
  "memo",
  'crew',
  "boardStatus",
  "sortOrder",
  "ownerId",
  "createdAt",
  "updatedAt"
FROM "shared_goals"
WHERE "boardStatus" IN ('now', 'later');

DROP TABLE "goal_build_links";
DROP TABLE "goal_proposals";
DROP TABLE "shared_goals";

ALTER TABLE "goal_required_items"
ADD CONSTRAINT "goal_required_items_goalId_fkey"
FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal_raid_targets"
ADD CONSTRAINT "goal_raid_targets_goalId_fkey"
FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal_sub_tasks"
ADD CONSTRAINT "goal_sub_tasks_goalId_fkey"
FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "build_post_images";
DROP TABLE "BuildPost";

CREATE TABLE "build_posts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "normalized_title" TEXT NOT NULL,
  "quest_name" TEXT,
  "overview" TEXT,
  "supplemental_notes" TEXT,
  "reference_url" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "build_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "build_post_images" (
  "id" TEXT NOT NULL,
  "build_post_id" TEXT NOT NULL,
  "storage_bucket" TEXT NOT NULL DEFAULT 'gbf-build-screenshots',
  "storage_path" TEXT NOT NULL,
  "public_url" TEXT,
  "original_name" TEXT,
  "mime_type" TEXT,
  "size_bytes" INTEGER,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "build_post_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "build_drafts" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "quest_name" TEXT,
  "overview" TEXT,
  "supplemental_notes" TEXT,
  "reference_url" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "build_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "build_draft_images" (
  "id" TEXT NOT NULL,
  "build_draft_id" TEXT NOT NULL,
  "storage_bucket" TEXT NOT NULL DEFAULT 'gbf-build-screenshots',
  "storage_path" TEXT NOT NULL,
  "public_url" TEXT,
  "original_name" TEXT,
  "mime_type" TEXT,
  "size_bytes" INTEGER,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "build_draft_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "progress_goals" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

DROP TABLE "MaterialPresetItem";
DROP TABLE "MaterialPreset";
DROP TABLE "MaterialItem";
DROP TABLE "MaterialGoal";
DROP TABLE "Task";
DROP TYPE "RepeatType";

CREATE UNIQUE INDEX "goals_source_round_goal_id_key" ON "goals"("source_round_goal_id");
CREATE UNIQUE INDEX "goals_source_progress_goal_id_key" ON "goals"("source_progress_goal_id");
CREATE INDEX "goals_owner_id_visibility_board_status_sort_order_idx"
ON "goals"("owner_id", "visibility", "board_status", "sort_order");
CREATE INDEX "goals_visibility_board_status_sort_order_idx"
ON "goals"("visibility", "board_status", "sort_order");
CREATE INDEX "round_goals_owner_id_sort_order_idx" ON "round_goals"("owner_id", "sort_order");
CREATE UNIQUE INDEX "build_posts_normalized_title_key" ON "build_posts"("normalized_title");
CREATE INDEX "build_posts_updated_at_idx" ON "build_posts"("updated_at");
CREATE INDEX "build_posts_owner_id_updated_at_idx" ON "build_posts"("owner_id", "updated_at");
CREATE INDEX "build_post_images_build_post_id_display_order_idx"
ON "build_post_images"("build_post_id", "display_order");
CREATE INDEX "build_drafts_owner_id_updated_at_idx" ON "build_drafts"("owner_id", "updated_at");
CREATE INDEX "build_draft_images_build_draft_id_display_order_idx"
ON "build_draft_images"("build_draft_id", "display_order");

ALTER TABLE "round_goals"
ADD CONSTRAINT "round_goals_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals"
ADD CONSTRAINT "goals_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals"
ADD CONSTRAINT "goals_source_round_goal_id_fkey"
FOREIGN KEY ("source_round_goal_id") REFERENCES "round_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals"
ADD CONSTRAINT "goals_source_progress_goal_id_fkey"
FOREIGN KEY ("source_progress_goal_id") REFERENCES "progress_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "build_posts"
ADD CONSTRAINT "build_posts_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "build_post_images"
ADD CONSTRAINT "build_post_images_build_post_id_fkey"
FOREIGN KEY ("build_post_id") REFERENCES "build_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "build_drafts"
ADD CONSTRAINT "build_drafts_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "build_draft_images"
ADD CONSTRAINT "build_draft_images_build_draft_id_fkey"
FOREIGN KEY ("build_draft_id") REFERENCES "build_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
