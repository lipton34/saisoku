export type StorageImageRef = { storageBucket: string; storagePath: string };

/** Retry transient Storage failures; never hide the original DB failure. */
export async function removeWithRetry(
  images: StorageImageRef[],
  remove: (images: StorageImageRef[]) => Promise<void>,
  attempts = 3,
  delay: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
  if (!images.length) return;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await remove(images);
      return;
    } catch (error) {
      if (i === attempts - 1) throw error;
      await delay(100 * 2 ** i);
    }
  }
}

/** Upload and persist are not atomic; compensate when persistence fails. */
export async function persistWithStorageCompensation<T>(
  upload: () => Promise<StorageImageRef>,
  persist: (stored: StorageImageRef) => Promise<T>,
  remove: (images: StorageImageRef[]) => Promise<void>,
  onCleanupFailure: (error: unknown, image: StorageImageRef) => void
): Promise<T> {
  const stored = await upload();
  try {
    return await persist(stored);
  } catch (dbError) {
    try {
      await removeWithRetry([stored], remove);
    } catch (cleanupError) {
      onCleanupFailure(cleanupError, stored);
    }
    throw dbError;
  }
}
