import assert from "node:assert/strict";
import test from "node:test";
import { raidGuideMasterDefinitions, validateRaidGuideMasterDefinitions } from "./raidGuideMasters.js";

test("raid guide master definitions are valid", () => {
  assert.doesNotThrow(() => validateRaidGuideMasterDefinitions());
  const lucifer = raidGuideMasterDefinitions.find((guide) => guide.id === "dark-rapture-zero-six-player-v1");
  assert.ok(lucifer);
  assert.equal(lucifer.sections.length, 5);
  assert.equal(lucifer.sections.flatMap((section) => section.rows).length, 34);
  assert.equal(lucifer.references.length, 2);
  assert.equal(lucifer.sections.at(-1)?.rows.some((row) => row.timingCondition === "HP6%"), true);
});
