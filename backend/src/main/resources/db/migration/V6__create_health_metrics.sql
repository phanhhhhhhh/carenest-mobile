-- CareNest: Create health_metrics table (vital signs and measurements for elderly users)

CREATE TABLE health_metrics (
    id              BIGSERIAL      PRIMARY KEY,
    elderly_id      BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(30)    NOT NULL CHECK (type IN ('BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE', 'WEIGHT', 'TEMPERATURE', 'SPO2')),
    value           DECIMAL(10, 2) NOT NULL,
    value_secondary DECIMAL(10, 2),           -- for blood pressure diastolic
    unit            VARCHAR(20)    NOT NULL,
    recorded_at     TIMESTAMPTZ    NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ    NULL
);
