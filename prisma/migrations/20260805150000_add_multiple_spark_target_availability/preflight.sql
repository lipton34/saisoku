SELECT
  COUNT(*) AS target_rows,
  COUNT("availability_period_id") AS linked_target_rows
FROM "spark_targets";
