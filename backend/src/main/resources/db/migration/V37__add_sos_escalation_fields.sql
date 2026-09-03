-- CareNest: Add SOS Escalation fields, secondary contact, and CANCELLED status (Ticket 2)

-- 1. Expand status check constraint to support CANCELLED
ALTER TABLE emergency_events DROP CONSTRAINT IF EXISTS emergency_events_status_check;
ALTER TABLE emergency_events ADD CONSTRAINT emergency_events_status_check
    CHECK (status IN ('ACTIVE', 'RESOLVED', 'FALSE_ALARM', 'CANCELLED'));

-- 2. Add escalation & emergency call audit columns to emergency_events
ALTER TABLE emergency_events
    ADD COLUMN IF NOT EXISTS escalation_level INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS emergency_call_logged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS emergency_call_logged_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add secondary family contact reference to elderly_profiles
ALTER TABLE elderly_profiles
    ADD COLUMN IF NOT EXISTS secondary_family_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 4. Index for efficient escalation polling of active unacknowledged events
CREATE INDEX IF NOT EXISTS idx_emergency_events_status_escalation
    ON emergency_events(status, escalation_level, triggered_at);
