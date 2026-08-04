export type RaidGuideRecentEntry = {
  guideId: string;
  strategyId: string | null;
  questName: string;
  strategyTitle: string;
  authorName: string;
  rowId: string | null;
  pageSize: 1 | 3 | 5;
  viewedAt: string;
};

function key(userId: string) {
  return `saisoku:raid-guide-reader:${userId}`;
}

export function loadRaidGuideRecents(userId: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key(userId)) ?? "[]") as RaidGuideRecentEntry[];
    return Array.isArray(value) ? value.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function saveRaidGuideRecent(userId: string, entry: RaidGuideRecentEntry) {
  const current = loadRaidGuideRecents(userId).filter(
    (item) => item.guideId !== entry.guideId || item.strategyId !== entry.strategyId
  );
  localStorage.setItem(key(userId), JSON.stringify([entry, ...current].slice(0, 3)));
}

export function findRaidGuideRecent(userId: string, guideId: string, strategyId: string | null) {
  return loadRaidGuideRecents(userId).find(
    (item) => item.guideId === guideId && item.strategyId === strategyId
  );
}
