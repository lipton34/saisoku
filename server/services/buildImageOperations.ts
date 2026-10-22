import { persistWithStorageCompensation, removeWithRetry, type StorageImageRef } from "./buildImageConsistency.js";

type UploadedImage = StorageImageRef & { publicUrl: string };

export async function saveBuildImage<T>(params: {
  storagePath: string;
  buffer: Buffer;
  mimeType: string;
  persist: (stored: UploadedImage) => Promise<T>;
  upload: (input: { path: string; buffer: Buffer; mimeType: string }) => Promise<{ bucket: string; publicUrl: string }>;
  remove: (images: StorageImageRef[]) => Promise<void>;
  logCleanupFailure: (error: unknown, reference: StorageImageRef) => void;
}): Promise<T> {
  return persistWithStorageCompensation(
    async () => {
      const stored = await params.upload({ path: params.storagePath, buffer: params.buffer, mimeType: params.mimeType });
      return { storageBucket: stored.bucket, storagePath: params.storagePath, publicUrl: stored.publicUrl };
    },
    params.persist,
    params.remove,
    params.logCleanupFailure
  );
}

/** Storage failures after successful DB delete are logged, without failing a completed HTTP deletion. */
export async function cleanupDeletedBuildImages(
  images: StorageImageRef[],
  remove: (images: StorageImageRef[]) => Promise<void>,
  onFailure: (error: unknown) => void
): Promise<void> {
  try {
    await removeWithRetry(images, remove);
  } catch (error) {
    onFailure(error);
  }
}
