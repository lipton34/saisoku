import assert from "node:assert/strict";
import test from "node:test";
import { parseSparkTargetAvailabilityIds } from "./sparkTargets.js";

test("排出時期は重複を除いて2件まで受け付ける", () => {
  assert.deepEqual(parseSparkTargetAvailabilityIds(["period-a", "period-a", "period-b"]), {
    ok: true,
    ids: ["period-a", "period-b"]
  });
  assert.deepEqual(parseSparkTargetAvailabilityIds(undefined), { ok: true, ids: [] });
});

test("異なる排出時期が3件ある場合は拒否する", () => {
  assert.deepEqual(parseSparkTargetAvailabilityIds(["period-a", "period-b", "period-c"]), {
    ok: false,
    message: "排出時期は2件まで選択できます"
  });
});
