-- Check-ins record only the three daily mood choices. SOS remains a separate
-- emergency-events flow and must never be inferred from a check-in mood.
--
-- NOT VALID deliberately preserves any historical mood-4 rows while enforcing
-- the 1-3 range for all new or updated rows. The constraint can be validated in
-- a later migration after a product-approved retention decision for legacy data.

ALTER TABLE check_ins
    DROP CONSTRAINT IF EXISTS check_ins_mood_check;

ALTER TABLE check_ins
    ADD CONSTRAINT check_ins_mood_check
    CHECK (mood BETWEEN 1 AND 3) NOT VALID;
