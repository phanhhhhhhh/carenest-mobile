-- CareNest: Create appointments table (medical appointments for elderly users)

CREATE TABLE appointments (
    id         BIGSERIAL    PRIMARY KEY,
    elderly_id BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor     VARCHAR(100) NOT NULL,
    specialty  VARCHAR(100),
    location   VARCHAR(200) NOT NULL,
    datetime   TIMESTAMPTZ  NOT NULL,
    notes      TEXT,
    status     VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  NULL
);
