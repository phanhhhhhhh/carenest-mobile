-- CareNest: Create users table (core identity for all roles)

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('ELDERLY', 'FAMILY', 'ADMIN')),
    phone       VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    dob         DATE,
    fcm_token   VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ  NULL
);
