export type JobCategory = "origin" | "class5" | "class4" | "ex2";

export type JobOption = {
  id: string;
  name: string;
  category: JobCategory;
  displayOrder?: number;
  thumbnailPath?: string;
};

export const JOB_CATEGORY_ORDER = [
  "origin",
  "class5",
  "class4",
  "ex2",
] as const;

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  origin: "オリジンクラス",
  class5: "Class.V",
  class4: "Class.IV",
  ex2: "EX2",
};

export function isJobCategory(value: string | undefined): value is JobCategory {
  return (JOB_CATEGORY_ORDER as readonly string[]).includes(value ?? "");
}

export function groupJobOptions<T extends { category?: string; name: string }>(
  items: T[],
) {
  const grouped = JOB_CATEGORY_ORDER.reduce(
    (acc, category) => ({ ...acc, [category]: [] as T[] }),
    {} as Record<JobCategory, T[]>,
  );

  for (const item of items) {
    if (item.category && isJobCategory(item.category)) {
      grouped[item.category].push(item);
    }
  }

  for (const category of JOB_CATEGORY_ORDER) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name, "ja-JP"));
  }

  return grouped;
}
