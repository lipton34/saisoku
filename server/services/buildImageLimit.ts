/** Raised inside the DB transaction so uploaded Storage objects are compensated. */
export class BuildImageLimitError extends Error {
  constructor() { super("画像は最大5枚までです"); }
}

/** Guard count + insert under an owner-specific transaction-scoped advisory lock. */
export async function createBuildImageWithinLimit<T>(
  lock: () => Promise<unknown>,
  count: () => Promise<number>,
  insert: (displayOrder: number) => Promise<T>,
  maxImages = 5
): Promise<T> {
  await lock();
  const existingCount = await count();
  if (existingCount >= maxImages) throw new BuildImageLimitError();
  return insert(existingCount);
}
