import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("all spark shared data mutations commit alongside audit entries", () => {
  const source = readFileSync(new URL("./sparkRewards.ts", import.meta.url), "utf8");
  const lines = source.split("\n");
  const mutationRoutes = lines.filter((line) => /router\.(post|put|delete)\("\/(availability-periods|event-types|records|schedules|month-statuses)/.test(line));
  assert.equal(mutationRoutes.length, 13);
  for (const line of mutationRoutes) {
    assert.match(line, /prisma\.\$transaction\(async \(tx\) =>/);
    assert.match(line, /await audit\(tx, req,/);
    assert.doesNotMatch(line, /await audit\(req,/);
    assert.doesNotMatch(line, /await prisma\.spark\w+\.(create|update|upsert|delete)\(/);
  }
});

test("audit uses transactional client rather than global prisma", () => {
  const source = readFileSync(new URL("./sparkRewards.ts", import.meta.url), "utf8");
  const audit = source.match(/async function audit\([\s\S]*?\nfunction handle/);
  assert.ok(audit);
  assert.match(audit[0], /tx\.sparkSharedAuditLog\.create/);
  assert.doesNotMatch(audit[0], /prisma\.sparkSharedAuditLog\.create/);
});
