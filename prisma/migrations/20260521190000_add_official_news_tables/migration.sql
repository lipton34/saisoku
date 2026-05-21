-- CreateEnum
CREATE TYPE "SourceArticleStatus" AS ENUM ('active', 'archived', 'fetch_error');

-- CreateEnum
CREATE TYPE "SourceArticleType" AS ENUM ('monthly_plan', 'event', 'campaign', 'update', 'gacha', 'character', 'media', 'maintenance', 'other');

-- CreateEnum
CREATE TYPE "ExtractedNewsItemType" AS ENUM ('event', 'campaign', 'update', 'monthly_plan_item', 'gacha', 'character', 'maintenance', 'other');

-- CreateEnum
CREATE TYPE "ExtractedNewsEventType" AS ENUM ('scenario_event', 'rerun_event', 'collaboration_event', 'guild_war', 'dread_barrage', 'rotb', 'xeno_clash', 'proving_grounds', 'tower_of_babyl', 'arcarum_event', 'side_story', 'special_event', 'unknown');

-- CreateEnum
CREATE TYPE "ExtractedNewsInfoStatus" AS ENUM ('confirmed', 'scheduled', 'tentative', 'unknown');

-- CreateTable
CREATE TABLE "source_articles" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_article_id" TEXT NOT NULL,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "official_url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "category_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "category_slugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "article_type" "SourceArticleType" NOT NULL DEFAULT 'other',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_hash" TEXT,
    "status" "SourceArticleStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "source_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_news_categories" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_category_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_news_items" (
    "id" TEXT NOT NULL,
    "source_article_id" TEXT NOT NULL,
    "item_type" "ExtractedNewsItemType" NOT NULL DEFAULT 'other',
    "title" TEXT,
    "event_type" "ExtractedNewsEventType" NOT NULL DEFAULT 'unknown',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "update_at_candidate" TIMESTAMP(3),
    "raw_date_text" TEXT,
    "summary" TEXT,
    "info_status" "ExtractedNewsInfoStatus" NOT NULL DEFAULT 'unknown',
    "extraction_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "related_key" TEXT,
    "display_priority" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_fetch_logs" (
    "id" TEXT NOT NULL,
    "run_type" TEXT NOT NULL,
    "target_period" TEXT,
    "fetched_count" INTEGER NOT NULL DEFAULT 0,
    "inserted_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "news_fetch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_articles_source_source_article_id_key" ON "source_articles"("source", "source_article_id");

-- CreateIndex
CREATE INDEX "source_articles_source_published_at_idx" ON "source_articles"("source", "published_at");

-- CreateIndex
CREATE INDEX "source_articles_source_article_type_idx" ON "source_articles"("source", "article_type");

-- CreateIndex
CREATE INDEX "source_articles_source_status_idx" ON "source_articles"("source", "status");

-- CreateIndex
CREATE INDEX "source_articles_content_hash_idx" ON "source_articles"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "official_news_categories_source_source_category_id_key" ON "official_news_categories"("source", "source_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "official_news_categories_source_slug_key" ON "official_news_categories"("source", "slug");

-- CreateIndex
CREATE INDEX "official_news_categories_source_sort_order_idx" ON "official_news_categories"("source", "sort_order");

-- CreateIndex
CREATE INDEX "extracted_news_items_source_article_id_idx" ON "extracted_news_items"("source_article_id");

-- CreateIndex
CREATE INDEX "extracted_news_items_item_type_idx" ON "extracted_news_items"("item_type");

-- CreateIndex
CREATE INDEX "extracted_news_items_event_type_idx" ON "extracted_news_items"("event_type");

-- CreateIndex
CREATE INDEX "extracted_news_items_info_status_idx" ON "extracted_news_items"("info_status");

-- CreateIndex
CREATE INDEX "extracted_news_items_starts_at_idx" ON "extracted_news_items"("starts_at");

-- CreateIndex
CREATE INDEX "extracted_news_items_ends_at_idx" ON "extracted_news_items"("ends_at");

-- CreateIndex
CREATE INDEX "news_fetch_logs_run_type_started_at_idx" ON "news_fetch_logs"("run_type", "started_at");

-- AddForeignKey
ALTER TABLE "extracted_news_items" ADD CONSTRAINT "extracted_news_items_source_article_id_fkey" FOREIGN KEY ("source_article_id") REFERENCES "source_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
