SELECT
  item."id",
  item."name",
  COUNT(target."id") AS "spark_target_count"
FROM "gbf_master_items" AS item
LEFT JOIN "spark_targets" AS target ON target."master_item_id" = item."id"
WHERE item."id" IN ('char-bikara', 'char-helel-ben-shalem')
GROUP BY item."id", item."name"
ORDER BY item."id";
