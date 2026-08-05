export const SPARK_TARGET_DRAW_COUNT = 300;
export const CRYSTALS_PER_DRAW = 300;

export type SparkSavingsCounts = {
  crystalCount: number;
  singleTicketCount: number;
  tenPullTicketCount: number;
};

export function calculateSparkSavings(counts: SparkSavingsCounts) {
  const crystalDrawCount = Math.floor(counts.crystalCount / CRYSTALS_PER_DRAW);
  const ticketDrawCount = counts.singleTicketCount + counts.tenPullTicketCount * 10;
  const currentDrawCount = crystalDrawCount + ticketDrawCount;
  const remainingDrawCount = Math.max(SPARK_TARGET_DRAW_COUNT - currentDrawCount, 0);
  const crystalRemainder = counts.crystalCount % CRYSTALS_PER_DRAW;
  const additionalCrystalCount = Math.max(
    remainingDrawCount * CRYSTALS_PER_DRAW - crystalRemainder,
    0
  );

  return {
    crystalDrawCount,
    ticketDrawCount,
    currentDrawCount,
    remainingDrawCount,
    additionalCrystalCount,
    excessDrawCount: Math.max(currentDrawCount - SPARK_TARGET_DRAW_COUNT, 0),
    isTargetReached: currentDrawCount >= SPARK_TARGET_DRAW_COUNT
  };
}
