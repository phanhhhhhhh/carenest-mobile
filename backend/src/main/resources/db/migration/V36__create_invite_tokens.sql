CREATE TABLE invite_tokens (
    id         BIGSERIAL PRIMARY KEY,
    elderly_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_invite_tokens_elderly ON invite_tokens(elderly_id);
