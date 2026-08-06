-- These duplicate character masters were never selected by a spark target in
-- production. Keep the established IDs and remove the later invalid copies.
DELETE FROM "gbf_master_items"
WHERE "id" IN ('char-bikara', 'char-helel-ben-shalem');
