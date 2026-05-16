-- AlterTable
ALTER TABLE "shared_goals" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "goal_proposals" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}';

-- Normalize legacy categories into the MVP category set.
UPDATE "shared_goals"
SET "category" = CASE
    WHEN "category" = '周回' THEN '周回'
    WHEN "category" = '高難度' THEN '編成'
    WHEN "category" = '育成' THEN 'その他'
    WHEN "category" = '古戦場' THEN '周回'
    WHEN "category" = '編成' THEN '編成'
    ELSE 'その他'
END;

UPDATE "goal_proposals"
SET "category" = CASE
    WHEN "category" = '周回' THEN '周回'
    WHEN "category" = '高難度' THEN '編成'
    WHEN "category" = '育成' THEN 'その他'
    WHEN "category" = '古戦場' THEN '周回'
    WHEN "category" = '編成' THEN '編成'
    ELSE 'その他'
END;

-- Carry existing generic fields into category-specific JSON where possible.
UPDATE "shared_goals"
SET "details" = jsonb_strip_nulls(jsonb_build_object(
    'itemName', CASE WHEN "category" = '周回' THEN "title" ELSE NULL END,
    'requiredCount', CASE WHEN "category" = '周回' THEN "targetValue" ELSE NULL END,
    'currentCount', CASE WHEN "category" = '周回' THEN "currentValue" ELSE NULL END,
    'content', CASE WHEN "category" = 'その他' THEN "description" ELSE NULL END
))
WHERE "details" = '{}'::jsonb;

UPDATE "goal_proposals"
SET "details" = jsonb_strip_nulls(jsonb_build_object(
    'itemName', CASE WHEN "category" = '周回' THEN "title" ELSE NULL END,
    'requiredCount', CASE WHEN "category" = '周回' THEN "targetValue" ELSE NULL END,
    'currentCount', CASE WHEN "category" = '周回' THEN 0 ELSE NULL END,
    'content', CASE WHEN "category" = 'その他' THEN "description" ELSE NULL END
))
WHERE "details" = '{}'::jsonb;
