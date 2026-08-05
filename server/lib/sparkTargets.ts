export function parseSparkTargetAvailabilityIds(value: unknown) {
  const ids = Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
  if (ids.length > 2) {
    return { ok: false as const, message: "排出時期は2件まで選択できます" };
  }
  return { ok: true as const, ids };
}
