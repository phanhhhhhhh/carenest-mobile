-- V30: emergency_events.acknowledged_by referenced no FK/index despite being
-- the SOS acknowledgement trail. Add both, matching the elderly_id FK pattern.

ALTER TABLE emergency_events
    ADD CONSTRAINT fk_emergency_events_acknowledged_by
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_events_acknowledged_by ON emergency_events(acknowledged_by);
