-- CareNest: Create medications table (prescribed medications for elderly users)

CREATE TABLE medications (
    id             BIGSERIAL    PRIMARY KEY,
    elderly_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    dosage         VARCHAR(100) NOT NULL,
    schedule       JSONB        NOT NULL DEFAULT '{}',  -- stores frequency, times, days
    next_dose_time TIMESTAMPTZ,
    instructions   TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ  NULL
);
