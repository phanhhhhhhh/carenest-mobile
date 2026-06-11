-- CareNest: Create performance indexes for common query patterns

-- Medication scheduler: find overdue doses
CREATE INDEX idx_medications_next_dose_time ON medications(next_dose_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_medications_elderly_id ON medications(elderly_id) WHERE deleted_at IS NULL;

-- Health metrics: date-range queries by elderly + type
CREATE INDEX idx_health_metrics_elderly_recorded ON health_metrics(elderly_id, type, recorded_at DESC) WHERE deleted_at IS NULL;

-- Medication logs: date-range
CREATE INDEX idx_medication_logs_medication_taken ON medication_logs(medication_id, taken_at DESC);

-- Appointments: date-range by elderly
CREATE INDEX idx_appointments_elderly_datetime ON appointments(elderly_id, datetime) WHERE deleted_at IS NULL;

-- Family links: bidirectional lookups
CREATE INDEX idx_family_links_elderly_id ON family_links(elderly_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_family_links_family_id ON family_links(family_id) WHERE deleted_at IS NULL;

-- Soft delete index on users
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
