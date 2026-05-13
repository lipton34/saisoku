-- Drop the duplicated purpose field. The goal title is now the single purpose label.
ALTER TABLE "MaterialGoal" DROP COLUMN "purpose";
