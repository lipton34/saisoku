CREATE TABLE "raid_guides" (
  "id" TEXT NOT NULL,
  "quest_master_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "overview" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "raid_guides_revision_check" CHECK ("revision" >= 1)
);

CREATE TABLE "raid_guide_sections" (
  "id" TEXT NOT NULL,
  "guide_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "raid_guide_rows" (
  "id" TEXT NOT NULL,
  "guide_id" TEXT NOT NULL,
  "section_id" TEXT NOT NULL,
  "timing_condition" TEXT NOT NULL,
  "enemy_action" TEXT NOT NULL,
  "required_response" TEXT NOT NULL,
  "supplemental_note" TEXT,
  "danger_level" TEXT NOT NULL DEFAULT 'normal',
  "sort_order" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_rows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "raid_guide_rows_danger_level_check" CHECK ("danger_level" IN ('normal', 'caution', 'danger')),
  CONSTRAINT "raid_guide_rows_timing_length_check" CHECK (char_length("timing_condition") BETWEEN 1 AND 100),
  CONSTRAINT "raid_guide_rows_enemy_length_check" CHECK (char_length("enemy_action") BETWEEN 1 AND 500),
  CONSTRAINT "raid_guide_rows_response_length_check" CHECK (char_length("required_response") BETWEEN 1 AND 500),
  CONSTRAINT "raid_guide_rows_note_length_check" CHECK ("supplemental_note" IS NULL OR char_length("supplemental_note") <= 500)
);

CREATE TABLE "raid_guide_row_links" (
  "id" TEXT NOT NULL,
  "source_row_id" TEXT NOT NULL,
  "target_row_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_row_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "raid_guide_row_links_not_self_check" CHECK ("source_row_id" <> "target_row_id")
);

CREATE TABLE "raid_guide_references" (
  "id" TEXT NOT NULL,
  "guide_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "raid_guide_strategies" (
  "id" TEXT NOT NULL,
  "guide_id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "overview" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'crew',
  "build_post_id" TEXT,
  "slot_number" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_strategies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "raid_guide_strategies_visibility_check" CHECK ("visibility" IN ('crew', 'personal')),
  CONSTRAINT "raid_guide_strategies_slot_check" CHECK ("slot_number" BETWEEN 1 AND 10),
  CONSTRAINT "raid_guide_strategies_title_length_check" CHECK (char_length("title") BETWEEN 1 AND 100),
  CONSTRAINT "raid_guide_strategies_overview_length_check" CHECK ("overview" IS NULL OR char_length("overview") <= 500)
);

CREATE TABLE "raid_guide_sticky_notes" (
  "id" TEXT NOT NULL,
  "strategy_id" TEXT NOT NULL,
  "guide_row_id" TEXT,
  "body" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT 'yellow',
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "raid_guide_sticky_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "raid_guide_sticky_notes_body_length_check" CHECK (char_length("body") BETWEEN 1 AND 500),
  CONSTRAINT "raid_guide_sticky_notes_color_check" CHECK ("color" IN ('yellow', 'blue', 'green', 'pink', 'purple'))
);

CREATE INDEX "raid_guides_quest_master_id_is_active_created_at_idx" ON "raid_guides"("quest_master_id", "is_active", "created_at");
CREATE UNIQUE INDEX "raid_guide_sections_guide_id_sort_order_key" ON "raid_guide_sections"("guide_id", "sort_order");
CREATE INDEX "raid_guide_sections_guide_id_is_active_sort_order_idx" ON "raid_guide_sections"("guide_id", "is_active", "sort_order");
CREATE UNIQUE INDEX "raid_guide_rows_section_id_sort_order_key" ON "raid_guide_rows"("section_id", "sort_order");
CREATE INDEX "raid_guide_rows_guide_id_section_id_is_active_sort_order_idx" ON "raid_guide_rows"("guide_id", "section_id", "is_active", "sort_order");
CREATE UNIQUE INDEX "raid_guide_row_links_source_row_id_target_row_id_key" ON "raid_guide_row_links"("source_row_id", "target_row_id");
CREATE UNIQUE INDEX "raid_guide_row_links_source_row_id_sort_order_key" ON "raid_guide_row_links"("source_row_id", "sort_order");
CREATE INDEX "raid_guide_row_links_target_row_id_idx" ON "raid_guide_row_links"("target_row_id");
CREATE UNIQUE INDEX "raid_guide_references_guide_id_url_key" ON "raid_guide_references"("guide_id", "url");
CREATE UNIQUE INDEX "raid_guide_references_guide_id_sort_order_key" ON "raid_guide_references"("guide_id", "sort_order");
CREATE UNIQUE INDEX "raid_guide_strategies_guide_id_owner_id_slot_number_key" ON "raid_guide_strategies"("guide_id", "owner_id", "slot_number");
CREATE INDEX "raid_guide_strategies_guide_id_visibility_updated_at_idx" ON "raid_guide_strategies"("guide_id", "visibility", "updated_at");
CREATE INDEX "raid_guide_strategies_guide_id_owner_id_updated_at_idx" ON "raid_guide_strategies"("guide_id", "owner_id", "updated_at");
CREATE INDEX "raid_guide_strategies_build_post_id_idx" ON "raid_guide_strategies"("build_post_id");
CREATE UNIQUE INDEX "raid_guide_sticky_notes_strategy_id_sort_order_key" ON "raid_guide_sticky_notes"("strategy_id", "sort_order");
CREATE INDEX "raid_guide_sticky_notes_strategy_id_guide_row_id_sort_order_idx" ON "raid_guide_sticky_notes"("strategy_id", "guide_row_id", "sort_order");
CREATE INDEX "raid_guide_sticky_notes_guide_row_id_idx" ON "raid_guide_sticky_notes"("guide_row_id");

ALTER TABLE "raid_guides" ADD CONSTRAINT "raid_guides_quest_master_id_fkey" FOREIGN KEY ("quest_master_id") REFERENCES "gbf_master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_sections" ADD CONSTRAINT "raid_guide_sections_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "raid_guides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_rows" ADD CONSTRAINT "raid_guide_rows_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "raid_guides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_rows" ADD CONSTRAINT "raid_guide_rows_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "raid_guide_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_row_links" ADD CONSTRAINT "raid_guide_row_links_source_row_id_fkey" FOREIGN KEY ("source_row_id") REFERENCES "raid_guide_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raid_guide_row_links" ADD CONSTRAINT "raid_guide_row_links_target_row_id_fkey" FOREIGN KEY ("target_row_id") REFERENCES "raid_guide_rows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_references" ADD CONSTRAINT "raid_guide_references_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "raid_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raid_guide_strategies" ADD CONSTRAINT "raid_guide_strategies_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "raid_guides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raid_guide_strategies" ADD CONSTRAINT "raid_guide_strategies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raid_guide_strategies" ADD CONSTRAINT "raid_guide_strategies_build_post_id_fkey" FOREIGN KEY ("build_post_id") REFERENCES "build_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raid_guide_sticky_notes" ADD CONSTRAINT "raid_guide_sticky_notes_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "raid_guide_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raid_guide_sticky_notes" ADD CONSTRAINT "raid_guide_sticky_notes_guide_row_id_fkey" FOREIGN KEY ("guide_row_id") REFERENCES "raid_guide_rows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
