-- CareNest: Create emergency_events table (UC-13 SOS + GPS)

CREATE TABLE emergency_events (
    id           BIGSERIAL    PRIMARY KEY,
    elderly_id   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude     DECIMAL(10, 7),
    longitude    DECIMAL(10, 7),
    address      TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'RESOLVED', 'FALSE_ALARM')),
    triggered_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resolved_at  TIMESTAMPTZ  NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_events_elderly_triggered
    ON emergency_events(elderly_id, triggered_at DESC);
