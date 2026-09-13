ALTER TABLE family_visit_settings
    ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN last_cycle_reminder_start DATE,
    ADD COLUMN last_birthday_reminder_year INTEGER,
    ADD COLUMN last_tet_reminder_date DATE;

UPDATE family_visit_settings settings
SET enabled = TRUE
WHERE settings.current_streak > 0
   OR settings.last_visit_at IS NOT NULL
   OR EXISTS (
       SELECT 1
       FROM family_visits visit
       WHERE visit.elderly_id = settings.elderly_id
   );

UPDATE users elderly
SET dob = settings.elderly_birthday
FROM family_visit_settings settings
WHERE elderly.id = settings.elderly_id
  AND elderly.dob IS NULL
  AND settings.elderly_birthday IS NOT NULL;

ALTER TABLE family_visit_settings
    DROP COLUMN elderly_birthday;
