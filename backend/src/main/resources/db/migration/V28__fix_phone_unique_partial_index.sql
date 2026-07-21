-- V28: users.phone uniqueness must not block soft-deleted users' numbers from being reused
-- Mirrors the pattern used for email in V24 (partial unique index instead of a hard column constraint)

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
