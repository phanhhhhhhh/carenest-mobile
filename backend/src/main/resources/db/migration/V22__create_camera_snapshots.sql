-- CareNest: Camera snapshots — SOS & scheduled check-in captures (UC-28, UC-29)

CREATE TABLE camera_snapshots (
    id                  BIGSERIAL    PRIMARY KEY,
    camera_id           BIGINT       NOT NULL REFERENCES camera_devices(id) ON DELETE CASCADE,
    elderly_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url           VARCHAR(1024) NULL,
    trigger             VARCHAR(20)  NOT NULL CHECK (trigger IN ('SOS', 'SCHEDULED', 'MANUAL')),
    emergency_event_id  BIGINT       NULL REFERENCES emergency_events(id) ON DELETE SET NULL,
    success             BOOLEAN      NOT NULL DEFAULT TRUE,
    error_message       VARCHAR(500) NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_camera_snapshots_elderly ON camera_snapshots(elderly_id, created_at DESC);
CREATE INDEX idx_camera_snapshots_emergency ON camera_snapshots(emergency_event_id);
