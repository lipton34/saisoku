-- CreateTable
CREATE TABLE "event_series" (
    "id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "default_memo_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_occurrences" (
    "id" TEXT NOT NULL,
    "event_series_id" TEXT NOT NULL,
    "news_item_id" TEXT,
    "title" TEXT NOT NULL,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "element" TEXT,
    "enemy_element" TEXT,
    "advantage_element" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'unknown',
    "source_article_id" TEXT,
    "official_url" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'unknown',
    "memo" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_occurrences_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "event_notes" ADD COLUMN "event_occurrence_id" TEXT;
ALTER TABLE "event_notes" ADD COLUMN "event_series_id" TEXT;
ALTER TABLE "event_notes" ALTER COLUMN "news_item_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "event_series_event_key_key" ON "event_series"("event_key");

-- CreateIndex
CREATE INDEX "event_series_event_type_idx" ON "event_series"("event_type");

-- CreateIndex
CREATE INDEX "event_occurrences_event_series_id_idx" ON "event_occurrences"("event_series_id");

-- CreateIndex
CREATE INDEX "event_occurrences_news_item_id_idx" ON "event_occurrences"("news_item_id");

-- CreateIndex
CREATE INDEX "event_occurrences_start_at_idx" ON "event_occurrences"("start_at");

-- CreateIndex
CREATE INDEX "event_occurrences_end_at_idx" ON "event_occurrences"("end_at");

-- CreateIndex
CREATE INDEX "event_occurrences_source_type_idx" ON "event_occurrences"("source_type");

-- CreateIndex
CREATE INDEX "event_occurrences_confidence_idx" ON "event_occurrences"("confidence");

-- CreateIndex
CREATE INDEX "event_occurrences_is_visible_idx" ON "event_occurrences"("is_visible");

-- CreateIndex
CREATE INDEX "event_notes_event_occurrence_id_idx" ON "event_notes"("event_occurrence_id");

-- CreateIndex
CREATE INDEX "event_notes_event_series_id_idx" ON "event_notes"("event_series_id");

-- AddForeignKey
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_series_id_fkey" FOREIGN KEY ("event_series_id") REFERENCES "event_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "extracted_news_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_event_occurrence_id_fkey" FOREIGN KEY ("event_occurrence_id") REFERENCES "event_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_event_series_id_fkey" FOREIGN KEY ("event_series_id") REFERENCES "event_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

