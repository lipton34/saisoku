-- The legacy evokers preset was unavailable and contained no verified requirements.
-- Product policy explicitly discards any rows created from that empty definition.
DELETE FROM "progress_goals"
WHERE "preset_id" = 'evokers';
