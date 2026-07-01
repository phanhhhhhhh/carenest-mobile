ALTER TABLE emergency_events ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE emergency_events ADD COLUMN IF NOT EXISTS acknowledged_by BIGINT;
