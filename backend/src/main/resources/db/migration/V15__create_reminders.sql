-- CareNest: General reminders (drink water, exercise, etc.) — created by elderly or family

CREATE TABLE reminders (
    id          BIGSERIAL    PRIMARY KEY,
    elderly_id  BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by  BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    remind_at   TIMESTAMPTZ  NOT NULL,
    repeat_rule VARCHAR(20)  NOT NULL DEFAULT 'NONE' CHECK (repeat_rule IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ  NULL
);

CREATE INDEX idx_reminders_elderly_remind
    ON reminders(elderly_id, remind_at);
