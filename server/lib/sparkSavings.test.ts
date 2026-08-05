import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSparkSavingsInput,
  sparkSavingsOwnerWhere,
  sparkSavingsResetData
} from "./sparkSavings.js";

const sparkSavingsModulePath = "../../src/lib/sparkSavings.ts";
const { calculateSparkSavings } = await import(sparkSavingsModulePath);

test("天井貯金の境界値と宝晶石端数を計算する", () => {
  assert.deepEqual(calculateSparkSavings({ crystalCount: 0, singleTicketCount: 0, tenPullTicketCount: 0 }), {
    crystalDrawCount: 0,
    ticketDrawCount: 0,
    currentDrawCount: 0,
    remainingDrawCount: 300,
    additionalCrystalCount: 90_000,
    excessDrawCount: 0,
    isTargetReached: false
  });
  assert.equal(calculateSparkSavings({ crystalCount: 299, singleTicketCount: 0, tenPullTicketCount: 0 }).additionalCrystalCount, 89_701);
  assert.equal(calculateSparkSavings({ crystalCount: 300, singleTicketCount: 0, tenPullTicketCount: 0 }).currentDrawCount, 1);
  assert.equal(calculateSparkSavings({ crystalCount: 55_299, singleTicketCount: 0, tenPullTicketCount: 2 }).additionalCrystalCount, 28_701);
});

test("単発と10連チケットを合算し、到達と超過を判定する", () => {
  assert.equal(calculateSparkSavings({ crystalCount: 0, singleTicketCount: 7, tenPullTicketCount: 0 }).ticketDrawCount, 7);
  assert.equal(calculateSparkSavings({ crystalCount: 0, singleTicketCount: 0, tenPullTicketCount: 3 }).ticketDrawCount, 30);
  assert.equal(calculateSparkSavings({ crystalCount: 30_000, singleTicketCount: 50, tenPullTicketCount: 15 }).currentDrawCount, 300);
  const exceeded = calculateSparkSavings({ crystalCount: 90_000, singleTicketCount: 1, tenPullTicketCount: 0 });
  assert.equal(exceeded.currentDrawCount, 301);
  assert.equal(exceeded.excessDrawCount, 1);
  assert.equal(exceeded.additionalCrystalCount, 0);
  assert.equal(exceeded.isTargetReached, true);
});

test("API入力を厳密に検証して正規化する", () => {
  const parsed = parseSparkSavingsInput({
    crystalCount: "000300",
    singleTicketCount: "2",
    tenPullTicketCount: "3",
    targetName: "  周年  ",
    plannedAt: "2028-02-29",
    memo: "   "
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.crystalCount, 300);
    assert.equal(parsed.value.targetName, "周年");
    assert.equal(parsed.value.plannedAt?.toISOString().slice(0, 10), "2028-02-29");
    assert.equal(parsed.value.memo, null);
  }

  for (const invalid of ["", "-1", "1.5", "1e3", "+1", "１"]) {
    assert.equal(parseSparkSavingsInput({ crystalCount: invalid, singleTicketCount: "0", tenPullTicketCount: "0" }).ok, false);
  }
  assert.equal(parseSparkSavingsInput({ crystalCount: "1000000000", singleTicketCount: "0", tenPullTicketCount: "0" }).ok, false);
  assert.equal(parseSparkSavingsInput({ crystalCount: "0", singleTicketCount: "1000000", tenPullTicketCount: "0" }).ok, false);
  assert.equal(parseSparkSavingsInput({ crystalCount: "0", singleTicketCount: "0", tenPullTicketCount: "100000" }).ok, false);
  assert.equal(parseSparkSavingsInput({ crystalCount: "0", singleTicketCount: "0", tenPullTicketCount: "0", plannedAt: "2027-02-29" }).ok, false);
});

test("所有者条件とリセット値は他ユーザーIDを受け取らない", () => {
  assert.deepEqual(sparkSavingsOwnerWhere("user-a"), { ownerId: "user-a" });
  assert.deepEqual(sparkSavingsResetData, {
    crystalCount: 0,
    singleTicketCount: 0,
    tenPullTicketCount: 0,
    targetName: null,
    plannedAt: null,
    memo: null
  });
});
