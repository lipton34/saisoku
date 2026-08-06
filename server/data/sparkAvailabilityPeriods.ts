import type { GbfMasterSeedItem } from "./gbfMasterSeed/types.js";

export const sparkAvailabilityPeriodDefinitions = [
  { id: "spark-period-legend-fest", kind: "annual", displayLabel: "レジェンドフェス", startMonth: null, startPart: null, endMonth: null, endPart: null },
  { id: "spark-period-grand-fest", kind: "annual", displayLabel: "グランデフェス", startMonth: null, startPart: null, endMonth: null, endPart: null },
  { id: "spark-period-summer-main", kind: "annual", displayLabel: "7～8月", startMonth: 7, startPart: null, endMonth: 8, endPart: null },
  { id: "spark-period-summer-rerun", kind: "annual", displayLabel: "3月中旬～4月中旬ごろ", startMonth: 3, startPart: "middle", endMonth: 4, endPart: "middle" },
  { id: "spark-period-valentine", kind: "annual", displayLabel: "2月上旬～月末ごろ", startMonth: 2, startPart: "early", endMonth: 2, endPart: "late" },
  { id: "spark-period-valentine-rerun", kind: "irregular", displayLabel: "9月ごろ", startMonth: 9, startPart: null, endMonth: 9, endPart: null },
  { id: "spark-period-halloween", kind: "annual", displayLabel: "10月上旬～月末ごろ", startMonth: 10, startPart: "early", endMonth: 10, endPart: "late" },
  { id: "spark-period-halloween-rerun", kind: "irregular", displayLabel: "5～6月ごろ", startMonth: 5, startPart: null, endMonth: 6, endPart: null },
  { id: "spark-period-christmas", kind: "annual", displayLabel: "11月末～12月25日ごろ", startMonth: 11, startPart: "late", endMonth: 12, endPart: "late" },
  { id: "spark-period-christmas-rerun", kind: "irregular", displayLabel: "6月ごろ", startMonth: 6, startPart: null, endMonth: 6, endPart: null },
  { id: "spark-period-dress-up", kind: "annual", displayLabel: "6月末～7月中旬ごろ", startMonth: 6, startPart: "late", endMonth: 7, endPart: "middle" },
] as const;

const periodIdsBySeasonalCategory: Record<string, string[]> = {
  水着: ["spark-period-summer-main", "spark-period-summer-rerun"],
  浴衣: ["spark-period-summer-main", "spark-period-summer-rerun"],
  バレンタイン: ["spark-period-valentine", "spark-period-valentine-rerun"],
  ハロウィン: ["spark-period-halloween", "spark-period-halloween-rerun"],
  クリスマス: ["spark-period-christmas", "spark-period-christmas-rerun"],
  ドレスアップ: ["spark-period-dress-up"],
};

export function availabilityPeriodIdsForMaster(item: GbfMasterSeedItem): string[] {
  const acquisitionGroup = String(item.metadata?.acquisitionGroup ?? "");
  if (acquisitionGroup === "zodiac") return ["spark-period-legend-fest"];
  if (acquisitionGroup === "limited") {
    return [item.metadata?.acquisitionFestival === "legend" ? "spark-period-legend-fest" : "spark-period-grand-fest"];
  }
  if (acquisitionGroup === "seasonal") {
    return periodIdsBySeasonalCategory[String(item.metadata?.seasonalCategory ?? "")] ?? [];
  }
  return [];
}

export const sparkTargetAcquisitionGroups = ["limited", "zodiac", "seasonal", "gacha-summon-series"] as const;
