-- CareNest: Create family_links table (relationships between elderly and family members)

CREATE TABLE family_links (
    id           BIGSERIAL   PRIMARY KEY,
    elderly_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ NULL,
    UNIQUE (elderly_id, family_id)
);
