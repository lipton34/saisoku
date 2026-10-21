/** Require an exact, duplicate-free permutation of the currently stored image IDs. */
export function isCompleteImageOrder(requested: unknown, storedIds: string[], maxImages = 5): requested is string[] {
  if (!Array.isArray(requested) || requested.length !== storedIds.length || requested.length > maxImages) return false;
  if (!requested.every((id) => typeof id === "string")) return false;
  const requestedSet = new Set<string>(requested);
  return requestedSet.size === requested.length && storedIds.every((id) => requestedSet.has(id));
}
