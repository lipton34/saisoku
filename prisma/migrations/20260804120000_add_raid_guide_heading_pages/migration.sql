ALTER TABLE "raid_guide_rows"
ADD COLUMN "page_type" TEXT NOT NULL DEFAULT 'guide';

ALTER TABLE "raid_guide_rows"
ADD CONSTRAINT "raid_guide_rows_page_type_check"
CHECK ("page_type" IN ('guide', 'heading'));
