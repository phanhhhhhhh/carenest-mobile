-- CareNest: Camera devices — Imou Open Platform integration (UC-26)

CREATE TABLE camera_devices (
    id                       BIGSERIAL    PRIMARY KEY,
    elderly_id               BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label                    VARCHAR(100) NOT NULL,
    device_sn                VARCHAR(64)  NOT NULL UNIQUE,
    device_id                VARCHAR(64)  NULL,
    access_token             VARCHAR(512) NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'OFFLINE'
                             CHECK (status IN ('ONLINE', 'OFFLINE', 'PRIVACY', 'ERROR')),
    last_seen_at             TIMESTAMPTZ  NULL,
    privacy_mode             BOOLEAN      NOT NULL DEFAULT FALSE,
    monitoring_window_start  VARCHAR(5)   NULL,
    monitoring_window_end    VARCHAR(5)   NULL,
    motion_detection_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
    snapshot_schedule        VARCHAR(100) NULL,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NULL
);

CREATE INDEX idx_camera_devices_elderly ON camera_devices(elderly_id);
