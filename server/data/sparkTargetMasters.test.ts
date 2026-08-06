import assert from "node:assert/strict";
import test from "node:test";
import { gbfMasterSeedItems, seasonalDefinitions } from "./gbfMasterSeed/index.js";
import { availabilityPeriodIdsForMaster, sparkAvailabilityPeriodDefinitions } from "./sparkAvailabilityPeriods.js";

test("狙い目用限定マスターの件数とキャラ解放武器リンクが一致する", () => {
  const byId = new Map(gbfMasterSeedItems.map((item) => [item.id, item]));
  assert.equal(byId.size, gbfMasterSeedItems.length, "マスターIDが重複しています");

  const expectedCounts = new Map([
    ["limited", 142],
    ["zodiac", 24],
    ["seasonal", 362],
    ["gacha-summon-series", 31],
  ]);
  for (const [group, expected] of expectedCounts) {
    assert.equal(gbfMasterSeedItems.filter((item) => item.metadata?.acquisitionGroup === group).length, expected, `${group}の件数が一致しません`);
  }
  assert.equal(seasonalDefinitions.length, 181);

  const pairedItems = gbfMasterSeedItems.filter((item) => ["limited", "zodiac", "seasonal"].includes(String(item.metadata?.acquisitionGroup)));
  for (const item of pairedItems) {
    if (item.kind === "character") {
      const weapon = byId.get(String(item.metadata?.unlockWeaponId));
      assert.equal(weapon?.metadata?.unlockCharacterId, item.id, `${item.name}の解放武器リンクが一致しません`);
    } else if (item.kind === "weapon") {
      const character = byId.get(String(item.metadata?.unlockCharacterId));
      assert.equal(character?.metadata?.unlockWeaponId, item.id, `${item.name}の解放キャラリンクが一致しません`);
    }
  }
});

test("狙い目マスターに排出時期が最大2件割り当てられる", () => {
  const limited = gbfMasterSeedItems.filter((item) => item.metadata?.acquisitionGroup === "limited");
  assert.equal(limited.filter((item) => item.metadata?.acquisitionFestival === "legend").length, 68);
  assert.equal(limited.filter((item) => item.metadata?.acquisitionFestival === "grand").length, 74);

  for (const item of gbfMasterSeedItems) {
    const group = String(item.metadata?.acquisitionGroup ?? "");
    const periodIds = availabilityPeriodIdsForMaster(item);
    assert.ok(periodIds.length <= 2, `${item.name}の排出時期が2件を超えています`);
    if (["limited", "zodiac", "seasonal"].includes(group)) {
      assert.ok(periodIds.length > 0, `${item.name}に排出時期がありません`);
    }
  }
});

test("水着・浴衣の春復刻時期は直近実績を包含する", () => {
  const rerun = sparkAvailabilityPeriodDefinitions.find((period) => period.id === "spark-period-summer-rerun");
  assert.deepEqual(rerun, {
    id: "spark-period-summer-rerun",
    kind: "annual",
    displayLabel: "3月中旬～4月中旬ごろ",
    startMonth: 3,
    startPart: "middle",
    endMonth: 4,
    endPart: "middle",
  });
});

test("季節限定の分類別件数が調査結果と一致する", () => {
  const expected = { 水着: 81, 浴衣: 26, バレンタイン: 16, ハロウィン: 23, クリスマス: 31, ドレスアップ: 4 };
  for (const [category, count] of Object.entries(expected)) {
    assert.equal(seasonalDefinitions.filter((item) => item.category === category).length, count, `${category}の件数が一致しません`);
  }
});
