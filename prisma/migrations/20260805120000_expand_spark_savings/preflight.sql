SELECT
  COUNT(*) AS savings_rows,
  COUNT("target_name") AS target_name_rows,
  COUNT("planned_at") AS planned_at_rows,
  COUNT("memo") AS memo_rows
FROM "spark_savings";
