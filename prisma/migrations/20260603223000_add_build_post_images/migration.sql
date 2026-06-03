-- CreateTable
CREATE TABLE "build_post_images" (
    "id" TEXT NOT NULL,
    "buildPostId" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL DEFAULT 'gbf-build-screenshots',
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "originalName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "build_post_images_buildPostId_displayOrder_idx" ON "build_post_images"("buildPostId", "displayOrder");

-- AddForeignKey
ALTER TABLE "build_post_images" ADD CONSTRAINT "build_post_images_buildPostId_fkey" FOREIGN KEY ("buildPostId") REFERENCES "BuildPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
