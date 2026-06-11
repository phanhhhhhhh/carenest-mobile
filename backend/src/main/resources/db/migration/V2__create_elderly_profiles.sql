-- CareNest: Create elderly_profiles table (extended health info for elderly users)

CREATE TABLE elderly_profiles (
    id                  BIGSERIAL   PRIMARY KEY,
    user_id             BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    health_conditions   JSONB       NOT NULL DEFAULT '[]',
    emergency_contacts  JSONB       NOT NULL DEFAULT '[]',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ NULL
);
