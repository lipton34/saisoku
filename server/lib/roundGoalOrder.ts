/** Require a complete, duplicate-free permutation of the owner's round-goal IDs. */
export function isCompleteRoundGoalOrder(requested: unknown, existing: readonly string[]): requested is string[] {
  if (!Array.isArray(requested) || requested.length !== existing.length) return false;
  if (!requested.every((id) => typeof id === "string")) return false;
  const ids = new Set<string>(requested);
  return ids.size === requested.length && existing.every((id) => ids.has(id));
}
