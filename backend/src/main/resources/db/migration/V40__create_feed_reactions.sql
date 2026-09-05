-- CareNest v3.5: Family Care Feed reactions (UC A2)
-- "Thả tim" — a family member reacts to a feed item (check-in / medication log /
-- emergency). A check-in counts as "handled" once it has >= 1 reaction.
-- item_type: CHECK_IN | MEDICATION_LOG | EMERGENCY ; item_ref = the source row id.

CREATE TABLE feed_reactions (
    id             BIGSERIAL   PRIMARY KEY,
    elderly_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type      VARCHAR(20) NOT NULL CHECK (item_type IN ('CHECK_IN', 'MEDICATION_LOG', 'EMERGENCY')),
    item_ref       BIGINT      NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (item_type, item_ref, family_user_id)
);

CREATE INDEX idx_feed_reactions_lookup ON feed_reactions(elderly_id, item_type, item_ref);
