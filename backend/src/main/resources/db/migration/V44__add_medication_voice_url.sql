-- CareNest v3.5: custom family-recorded medication reminder voice (UC B2, Family Plus).
-- Schedules are entered by typing or voice-to-text (never prescription-photo OCR);
-- this column stores an optional recording of a relative's voice that the Elderly
-- device plays at reminder time instead of the standard prompt.

ALTER TABLE medications ADD COLUMN IF NOT EXISTS voice_url VARCHAR(512);
