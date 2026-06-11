-- CareNest: Rollback V8 — drop all performance indexes
-- Run manually; NOT auto-executed by Flyway Community

DROP INDEX IF EXISTS idx_medications_next_dose_time;
DROP INDEX IF EXISTS idx_medications_elderly_id;
DROP INDEX IF EXISTS idx_health_metrics_elderly_recorded;
DROP INDEX IF EXISTS idx_medication_logs_medication_taken;
DROP INDEX IF EXISTS idx_appointments_elderly_datetime;
DROP INDEX IF EXISTS idx_family_links_elderly_id;
DROP INDEX IF EXISTS idx_family_links_family_id;
DROP INDEX IF EXISTS idx_users_deleted_at;
