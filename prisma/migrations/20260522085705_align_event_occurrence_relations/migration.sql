-- DropForeignKey
ALTER TABLE "event_notes" DROP CONSTRAINT "event_notes_news_item_id_fkey";

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "extracted_news_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
