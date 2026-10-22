export type InventoryBatchChange = { itemKey: string; itemName: string; ownedCount: number };

/** Validate the entire request before any database mutation. */
export function validateInventoryBatch(
  input: unknown,
  requirements: readonly { itemKey: string; itemName: string }[],
  maxCount = 9_999_999
): InventoryBatchChange[] | null {
  if (!Array.isArray(input) || input.length > 500) return null;
  const names = new Map(requirements.map((requirement) => [requirement.itemKey, requirement.itemName]));
  const seen = new Set<string>();
  const changes: InventoryBatchChange[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const { itemKey, ownedCount } = entry as Record<string, unknown>;
    if (typeof itemKey !== "string" || !names.has(itemKey) || seen.has(itemKey)) return null;
    if (typeof ownedCount !== "number" || !Number.isSafeInteger(ownedCount) || ownedCount < 0 || ownedCount > maxCount) return null;
    seen.add(itemKey);
    changes.push({ itemKey, itemName: names.get(itemKey)!, ownedCount });
  }
  return changes;
}
