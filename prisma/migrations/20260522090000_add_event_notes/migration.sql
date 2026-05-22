-- CreateTable
CREATE TABLE "event_notes" (
    "id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "news_item_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "minimum_goals" TEXT,
    "target_weapons" TEXT,
    "target_summons" TEXT,
    "target_items" TEXT,
    "farming_notes" TEXT,
    "caution_notes" TEXT,
    "free_memo" TEXT,
    "source_note_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_note_links" (
    "id" TEXT NOT NULL,
    "event_note_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "site_name" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_note_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_notes_news_item_id_idx" ON "event_notes"("news_item_id");

-- CreateIndex
CREATE INDEX "event_notes_event_key_idx" ON "event_notes"("event_key");

-- CreateIndex
CREATE INDEX "event_notes_source_note_id_idx" ON "event_notes"("source_note_id");

-- CreateIndex
CREATE INDEX "event_note_links_event_note_id_idx" ON "event_note_links"("event_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_note_links_event_note_id_url_key" ON "event_note_links"("event_note_id", "url");

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "extracted_news_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "event_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_note_links" ADD CONSTRAINT "event_note_links_event_note_id_fkey" FOREIGN KEY ("event_note_id") REFERENCES "event_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
