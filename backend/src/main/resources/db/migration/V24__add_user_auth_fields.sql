-- V24: Add email/password/PIN auth fields to users table
-- Production-ready authentication system

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pin VARCHAR(10);

-- Email should be unique among non-deleted users
-- (can't use partial unique index easily with all DBs, enforced in application layer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
