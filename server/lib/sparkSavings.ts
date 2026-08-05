export const SPARK_SAVINGS_LIMITS = {
  crystalCount: 999_999_999,
  singleTicketCount: 999_999,
  tenPullTicketCount: 99_999,
  targetName: 100,
  memo: 2_000
} as const;

export type SparkSavingsInput = {
  crystalCount: number;
  singleTicketCount: number;
  tenPullTicketCount: number;
  targetName: string | null;
  plannedAt: Date | null;
  memo: string | null;
};

type ParseResult =
  | { ok: true; value: SparkSavingsInput }
  | { ok: false; message: string };

function parseCount(value: unknown, label: string, maximum: number): number | string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return `${label}は0以上の整数で入力してください`;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    return `${label}は${maximum.toLocaleString("ja-JP")}以下で入力してください`;
  }

  return parsed;
}

function parseOptionalText(value: unknown, label: string, maximum: number): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`${label}を確認してください`);
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (Array.from(normalized).length > maximum) {
    throw new Error(`${label}は${maximum.toLocaleString("ja-JP")}文字以内で入力してください`);
  }
  return normalized;
}

function parsePlannedAt(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("使用予定日はYYYY-MM-DD形式の有効な日付で入力してください");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("使用予定日は有効な日付で入力してください");
  }
  return date;
}

export function parseSparkSavingsInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "入力内容を確認してください" };
  }

  const input = body as Record<string, unknown>;
  const crystalCount = parseCount(input.crystalCount, "宝晶石", SPARK_SAVINGS_LIMITS.crystalCount);
  if (typeof crystalCount === "string") return { ok: false, message: crystalCount };
  const singleTicketCount = parseCount(input.singleTicketCount, "単発チケット", SPARK_SAVINGS_LIMITS.singleTicketCount);
  if (typeof singleTicketCount === "string") return { ok: false, message: singleTicketCount };
  const tenPullTicketCount = parseCount(input.tenPullTicketCount, "10連チケット", SPARK_SAVINGS_LIMITS.tenPullTicketCount);
  if (typeof tenPullTicketCount === "string") return { ok: false, message: tenPullTicketCount };

  try {
    return {
      ok: true,
      value: {
        crystalCount,
        singleTicketCount,
        tenPullTicketCount,
        targetName: parseOptionalText(input.targetName, "目的", SPARK_SAVINGS_LIMITS.targetName),
        plannedAt: parsePlannedAt(input.plannedAt),
        memo: parseOptionalText(input.memo, "メモ", SPARK_SAVINGS_LIMITS.memo)
      }
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "入力内容を確認してください" };
  }
}

export function sparkSavingsOwnerWhere(ownerId: string) {
  return { ownerId } as const;
}

export const sparkSavingsResetData = {
  crystalCount: 0,
  singleTicketCount: 0,
  tenPullTicketCount: 0,
  targetName: null,
  plannedAt: null,
  memo: null
} as const;

export function serializeSparkSavings(savings: {
  id: string;
  crystalCount: number;
  singleTicketCount: number;
  tenPullTicketCount: number;
  targetName: string | null;
  plannedAt: Date | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: savings.id,
    crystalCount: savings.crystalCount,
    singleTicketCount: savings.singleTicketCount,
    tenPullTicketCount: savings.tenPullTicketCount,
    targetName: savings.targetName,
    plannedAt: savings.plannedAt?.toISOString().slice(0, 10) ?? null,
    memo: savings.memo,
    createdAt: savings.createdAt.toISOString(),
    updatedAt: savings.updatedAt.toISOString()
  };
}
