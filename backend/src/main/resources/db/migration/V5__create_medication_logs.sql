-- CareNest: Create medication_logs table (audit trail for each dose event)

CREATE TABLE medication_logs (
    id            BIGSERIAL   PRIMARY KEY,
    medication_id BIGINT      NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    taken_at      TIMESTAMPTZ NOT NULL,
    status        VARCHAR(20) NOT NULL CHECK (status IN ('TAKEN', 'MISSED', 'SKIPPED')),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
