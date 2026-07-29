-- Run read-only against the target database after
-- 20260725090000_mobile_first_reorganization and before migration.sql.

SELECT 'goal_sub_tasks' AS target, COUNT(*) AS row_count FROM "goal_sub_tasks"
UNION ALL
SELECT 'goal_sub_tasks_done', COUNT(*) FROM "goal_sub_tasks" WHERE "isDone" = true
UNION ALL
SELECT 'goal_sub_tasks_open', COUNT(*) FROM "goal_sub_tasks" WHERE "isDone" = false
UNION ALL
SELECT 'goals_with_sub_tasks', COUNT(DISTINCT "goalId") FROM "goal_sub_tasks"
UNION ALL
SELECT 'goal_required_items', COUNT(*) FROM "goal_required_items"
UNION ALL
SELECT 'goals_with_required_items', COUNT(DISTINCT "goalId") FROM "goal_required_items"
UNION ALL
SELECT 'goal_raid_targets', COUNT(*) FROM "goal_raid_targets"
UNION ALL
SELECT 'goals_with_raid_targets', COUNT(DISTINCT "goalId") FROM "goal_raid_targets";

SELECT COALESCE(MAX(item_count), 0) AS max_sub_tasks_per_goal
FROM (
  SELECT COUNT(*) AS item_count
  FROM "goal_sub_tasks"
  GROUP BY "goalId"
) counts;

SELECT "goalId", "sortOrder", COUNT(*) AS duplicate_count
FROM "goal_sub_tasks"
GROUP BY "goalId", "sortOrder"
HAVING COUNT(*) > 1
ORDER BY "goalId", "sortOrder";

SELECT COUNT(*) AS orphan_sub_tasks
FROM "goal_sub_tasks" item
LEFT JOIN "goals" goal ON goal."id" = item."goalId"
WHERE goal."id" IS NULL;
