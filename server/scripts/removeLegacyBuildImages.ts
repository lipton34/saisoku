import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { removeBuildImagesFromStorage } from "../services/buildImageStorage.js";

const confirmationFlag = "--confirm-delete-legacy-build-images";
const prisma = new PrismaClient();

type LegacyBuildImage = {
  storageBucket: string;
  storagePath: string;
};

async function main() {
  if (!process.argv.includes(confirmationFlag)) {
    throw new Error(
      `削除は実行していません。対象環境と件数を確認後、${confirmationFlag} を付けて再実行してください。`
    );
  }

  const images = await prisma.$queryRaw<LegacyBuildImage[]>`
    SELECT
      "storageBucket" AS "storageBucket",
      "storagePath" AS "storagePath"
    FROM "build_post_images"
    ORDER BY "storageBucket", "storagePath"
  `;

  console.log(`旧編成画像 ${images.length} 件をStorageから削除します。`);
  await removeBuildImagesFromStorage(images);
  console.log(`旧編成画像 ${images.length} 件を削除しました。`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
