-- Normalize goal statuses to the simplified MVP set.
UPDATE "shared_goals"
SET "status" = CASE
    WHEN "status" = '達成' THEN '達成'
    ELSE '未達成'
END;

ALTER TABLE "shared_goals" ALTER COLUMN "status" SET DEFAULT '未達成';
