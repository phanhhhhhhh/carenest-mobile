-- CareNest: Rollback V1 — drop users table
-- WARNING: Run AFTER R2, R3, R4, R5, R6, R7, R8 due to FK dependencies

DROP TABLE IF EXISTS users CASCADE;
