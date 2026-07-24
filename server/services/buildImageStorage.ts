import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const defaultBucket = "gbf-build-screenshots";
let storageClient: SupabaseClient | null = null;
let bucketReady = false;

export function buildScreenshotBucket() {
  return process.env.SUPABASE_BUILD_SCREENSHOT_BUCKET?.trim() || defaultBucket;
}

function requireStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase Storage設定が不足しています");
  }

  storageClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return storageClient;
}

async function ensureBucket(client: SupabaseClient, bucket: string) {
  if (bucketReady) {
    return;
  }

  const { data } = await client.storage.getBucket(bucket);
  if (!data) {
    const { error } = await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Storage bucketの準備に失敗しました: ${error.message}`);
    }
  }

  bucketReady = true;
}

export async function uploadBuildImageToStorage(params: {
  path: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const client = requireStorageClient();
  const bucket = buildScreenshotBucket();
  await ensureBucket(client, bucket);

  const { error } = await client.storage.from(bucket).upload(params.path, params.buffer, {
    contentType: params.mimeType,
    upsert: false
  });

  if (error) {
    throw new Error(`画像アップロードに失敗しました: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(params.path);
  return {
    bucket,
    publicUrl: data.publicUrl
  };
}

export async function removeBuildImagesFromStorage(images: { storageBucket: string; storagePath: string }[]) {
  const client = requireStorageClient();
  const byBucket = new Map<string, string[]>();

  for (const image of images) {
    const paths = byBucket.get(image.storageBucket) ?? [];
    paths.push(image.storagePath);
    byBucket.set(image.storageBucket, paths);
  }

  await Promise.all(
    Array.from(byBucket.entries()).map(async ([bucket, paths]) => {
      if (paths.length === 0) {
        return;
      }
      const { error } = await client.storage.from(bucket).remove(paths);
      if (error) {
        throw new Error(`画像削除に失敗しました: ${error.message}`);
      }
    })
  );
}

export async function copyBuildImageInStorage(params: {
  bucket: string;
  sourcePath: string;
  destinationPath: string;
}) {
  const client = requireStorageClient();
  await ensureBucket(client, params.bucket);
  const { error } = await client.storage.from(params.bucket).copy(params.sourcePath, params.destinationPath);
  if (error) {
    throw new Error(`画像コピーに失敗しました: ${error.message}`);
  }
  const { data } = client.storage.from(params.bucket).getPublicUrl(params.destinationPath);
  return { publicUrl: data.publicUrl };
}
