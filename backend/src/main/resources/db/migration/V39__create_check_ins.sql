-- CareNest v3.5: Daily 1-Touch Check-in (UC A1)
-- Elderly taps one of 4 mood buttons on the home screen once a day. Stored
-- separately from health_metrics so it stays clear of threshold/anomaly logic.
-- mood: 1 = 😊 tot, 2 = 😐 binh thuong, 3 = 😣 met, 4 = 🆘 (khan cap - also fires SOS)

CREATE TABLE check_ins (
    id          BIGSERIAL   PRIMARY KEY,
    elderly_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood        SMALLINT    NOT NULL CHECK (mood BETWEEN 1 AND 4),
    note        TEXT,
    source      VARCHAR(20) NOT NULL DEFAULT 'BUTTON' CHECK (source IN ('BUTTON', 'VOICE', 'PHOTO')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_check_ins_elderly_created ON check_ins(elderly_id, created_at DESC);
