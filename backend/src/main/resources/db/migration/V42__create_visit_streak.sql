-- CareNest v3.5: Home Visit Reminder / Visit Streak (UC A7)
--
-- Encourages real in-person visits without ranking or shaming. Each family
-- confirms a visit MANUALLY ("Xác nhận đã về thăm") — camera / motion data is
-- never used to infer a visit. A "streak" of consecutive weekly or monthly
-- cycles with at least one visit is kept per family; missing a cycle breaks it
-- and the app sends a gentle, non-judgemental nudge. Tet and the elderly
-- person's birthday trigger their own independent advance reminders.

CREATE TABLE family_visit_settings (
    id               BIGSERIAL   PRIMARY KEY,
    elderly_id       BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    cycle_type       VARCHAR(10) NOT NULL DEFAULT 'WEEKLY'
        CHECK (cycle_type IN ('WEEKLY', 'MONTHLY')),
    current_streak   INT         NOT NULL DEFAULT 0,
    longest_streak   INT         NOT NULL DEFAULT 0,
    last_visit_at    TIMESTAMPTZ,
    elderly_birthday DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_visits (
    id          BIGSERIAL   PRIMARY KEY,
    elderly_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_visits_elderly ON family_visits(elderly_id, visited_at DESC);
CREATE INDEX idx_family_visits_member ON family_visits(member_id, visited_at DESC);
