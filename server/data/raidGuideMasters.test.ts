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

  const tengen = raidGuideMasterDefinitions.find((guide) => guide.id === "the-world-of-six-dragons-six-player-v1");
  assert.ok(tengen);
  assert.equal(tengen.questMasterId, "quest-the-world-of-six-dragons");
  assert.equal(tengen.sections.length, 7);
  assert.equal(tengen.revision, 4);
  assert.equal(tengen.sections.flatMap((section) => section.rows).length, 27);
  assert.equal(tengen.references.length, 2);
  assert.equal(tengen.sections.at(-1)?.rows.at(-1)?.enemyAction.includes("ラツィオ・エグゼティウム"), true);
});
