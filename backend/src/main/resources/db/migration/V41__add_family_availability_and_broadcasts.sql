-- CareNest v3.5: Free Broadcast (sequential) + family escalation (UC A3 / A4)
--
-- Each family member sets their own FREE / BUSY state. A daily attention event
-- (e.g. an unwell check-in) pages ONE free member at a time, oldest-notified
-- first; if nobody acks within ~15 min it moves to the next free member, and
-- once the free list is exhausted OR 2 h have passed the whole family is paged.
-- This never applies to SOS — SOS always fans out to everyone immediately.

ALTER TABLE family_links
    ADD COLUMN IF NOT EXISTS availability_status VARCHAR(10) NOT NULL DEFAULT 'FREE'
        CHECK (availability_status IN ('FREE', 'BUSY')),
    ADD COLUMN IF NOT EXISTS last_ack_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

CREATE TABLE family_broadcasts (
    id                   BIGSERIAL   PRIMARY KEY,
    elderly_id           BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trigger_type         VARCHAR(30) NOT NULL,
    trigger_ref          BIGINT,
    title                VARCHAR(200) NOT NULL,
    body                 VARCHAR(500) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'ESCALATED')),
    current_recipient_id BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    notified_user_ids    TEXT,
    started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_notified_at  TIMESTAMPTZ,
    acknowledged_at      TIMESTAMPTZ,
    acknowledged_by      BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    escalated_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_broadcasts_active ON family_broadcasts(status, current_notified_at);
CREATE INDEX idx_family_broadcasts_trigger ON family_broadcasts(trigger_type, trigger_ref);
