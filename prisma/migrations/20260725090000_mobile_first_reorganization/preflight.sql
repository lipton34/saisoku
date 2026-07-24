-- Run this read-only query against the target database before applying migration.sql.
-- No backup is created; confirm the counts and deletion conditions explicitly.

SELECT 'tasks' AS target, COUNT(*) AS row_count FROM "Task"
UNION ALL
SELECT 'material_goals', COUNT(*) FROM "MaterialGoal"
UNION ALL
SELECT 'material_items', COUNT(*) FROM "MaterialItem"
UNION ALL
SELECT 'material_presets', COUNT(*) FROM "MaterialPreset"
UNION ALL
SELECT 'material_preset_items', COUNT(*) FROM "MaterialPresetItem"
UNION ALL
SELECT 'build_posts', COUNT(*) FROM "BuildPost"
UNION ALL
SELECT 'build_post_images', COUNT(*) FROM "build_post_images"
UNION ALL
SELECT 'goal_build_links', COUNT(*) FROM "goal_build_links"
UNION ALL
SELECT 'goal_proposals', COUNT(*) FROM "goal_proposals"
UNION ALL
SELECT 'goals_deleted_by_status', COUNT(*) FROM "shared_goals" WHERE "boardStatus" IN ('next', 'paused', 'done')
UNION ALL
SELECT 'goals_preserved', COUNT(*) FROM "shared_goals" WHERE "boardStatus" IN ('now', 'later');

-- Before applying migration.sql, run the separately confirmed Storage cleanup:
-- npm run migration:remove-legacy-build-images -- --confirm-delete-legacy-build-images
