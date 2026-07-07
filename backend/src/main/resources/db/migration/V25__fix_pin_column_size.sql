-- V25: Fix pin column size — BCrypt hashes are ~60 chars
ALTER TABLE users ALTER COLUMN pin TYPE VARCHAR(255);
