-- CareNest: Notification inbox — persists all sent notifications for in-app history

CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL CHECK (type IN (
                   'MEDICATION_REMINDER',
                   'HEALTH_ALERT',
                   'EMERGENCY',
                   'APPOINTMENT_REMINDER',
                   'FAMILY_UPDATE'
               )),
    title      VARCHAR(255) NOT NULL,
    body       TEXT,
    data       JSONB        NOT NULL DEFAULT '{}',
    read_at    TIMESTAMPTZ  NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created
    ON notifications(user_id, created_at DESC);
