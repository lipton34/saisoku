import { isCompleteImageOrder } from "../lib/buildImageOrder.js";

type UpdateResult = { count: number };

/** Shared image-order workflow. Model ownership is scoped by each caller's callbacks. */
export async function reorderOwnedBuildImages(
  requestedIds: unknown,
  loadIds: () => Promise<string[]>,
  update: (id: string, displayOrder: number) => Promise<UpdateResult>,
  maxImages = 5
): Promise<boolean> {
  const existingIds = await loadIds();
  if (!isCompleteImageOrder(requestedIds, existingIds, maxImages)) return false;
  for (const [order, id] of requestedIds.entries()) {
    const result = await update(id, order);
    if (result.count !== 1) return false;
  }
  return true;
}
