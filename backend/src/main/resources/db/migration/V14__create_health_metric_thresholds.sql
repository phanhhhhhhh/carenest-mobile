-- CareNest: Per-user alert thresholds for health metrics — triggers family notification when exceeded

CREATE TABLE health_metric_thresholds (
    id                  BIGSERIAL      PRIMARY KEY,
    elderly_id          BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type         VARCHAR(30)    NOT NULL CHECK (metric_type IN (
                            'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE',
                            'WEIGHT', 'TEMPERATURE', 'SPO2'
                        )),
    min_value           DECIMAL(10, 2),
    max_value           DECIMAL(10, 2),
    min_value_secondary DECIMAL(10, 2),  -- diastolic lower bound for BLOOD_PRESSURE
    max_value_secondary DECIMAL(10, 2),  -- diastolic upper bound for BLOOD_PRESSURE
    alert_family        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (elderly_id, metric_type)
);
