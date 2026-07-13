-- V26: Make phone nullable — email-only registration doesn't require phone
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
