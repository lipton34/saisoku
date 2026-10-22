export type ProgressOwnerValues = {
  inventory: ReadonlyMap<string, number>;
  shared: ReadonlyMap<string, number>;
};

/** Load owner-wide values once per list request; never share this mutable snapshot across requests. */
export async function loadProgressOwnerValues(
  ownerId: string,
  dependencies: {
    inventory: (ownerId: string) => Promise<Array<{ itemKey: string; ownedCount: number }>>;
    shared: (ownerId: string) => Promise<Array<{ valueKey: string; value: number }>>;
  }
): Promise<ProgressOwnerValues> {
  const [inventory, shared] = await Promise.all([
    dependencies.inventory(ownerId),
    dependencies.shared(ownerId)
  ]);
  return {
    inventory: new Map(inventory.map((item) => [item.itemKey, item.ownedCount])),
    shared: new Map(shared.map((item) => [item.valueKey, item.value]))
  };
}

/** Each goal gets its own Map because overrides must not mutate the shared snapshot. */
export function mergeGoalInventory(
  values: ReadonlyMap<string, number>,
  overrides?: ReadonlyMap<string, number>
) {
  const inventory = new Map(values);
  for (const [key, count] of overrides ?? []) inventory.set(key, count);
  return inventory;
}
