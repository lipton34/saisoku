export const MAX_PINNED_PROGRESS_MATERIALS = 8;

export function validatePinnedMaterialKeys(value: unknown, knownItemKeys: Set<string>) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return { keys: null, message: "掲示する素材の形式が不正です" };
  }
  const keys = [...new Set(value)];
  if (keys.length > MAX_PINNED_PROGRESS_MATERIALS) {
    return { keys: null, message: `掲示できる素材は${MAX_PINNED_PROGRESS_MATERIALS}件までです` };
  }
  if (keys.some((key) => !knownItemKeys.has(key))) {
    return { keys: null, message: "この目標で使用しない素材は掲示できません" };
  }
  return { keys, message: null };
}

export function pinnedMaterialKeysFromSelection(selection: unknown) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) return [];
  const value = (selection as Record<string, unknown>).pinnedMaterialKeys;
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...new Set(value)].slice(0, MAX_PINNED_PROGRESS_MATERIALS)
    : [];
}
