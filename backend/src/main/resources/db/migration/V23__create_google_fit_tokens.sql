-- UC-10: Google Fit token persistence
-- Replaces in-memory HashMap storage with DB-backed tokens
CREATE TABLE IF NOT EXISTS google_fit_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    access_token VARCHAR(2048),
    refresh_token VARCHAR(512),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_google_fit_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_google_fit_tokens_user_id ON google_fit_tokens(user_id);
