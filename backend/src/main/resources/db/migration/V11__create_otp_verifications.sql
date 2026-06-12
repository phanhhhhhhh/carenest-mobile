-- CareNest: OTP verification for phone-based authentication

CREATE TABLE otp_verifications (
    id          BIGSERIAL   PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL,
    otp_code    VARCHAR(10) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ NULL,
    attempts    SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_verifications_phone_created
    ON otp_verifications(phone, created_at DESC);
