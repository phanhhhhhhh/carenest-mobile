-- CareNest: Rollback V7 — drop appointments table
-- Run manually after R8 (indexes must be dropped first)

DROP TABLE IF EXISTS appointments;
