/** Accept only the two JSON boolean literals for a month status. */
export function parseSparkMonthComplete(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("集計完了フラグはtrueまたはfalseを指定してください");
  return value;
}
