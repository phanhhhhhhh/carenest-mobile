-- CareNest: Chat history — persists AI companion conversations (UC-16)

CREATE TABLE chat_messages (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(10)  NOT NULL CHECK (role IN ('USER', 'AI')),
    content      TEXT         NOT NULL,
    intent       VARCHAR(30)  NULL CHECK (intent IN (
                     'HEALTH', 'MEDICATION', 'APPOINTMENT', 'GENERAL', 'REMINDER'
                 )),
    context_data JSONB        NOT NULL DEFAULT '{}',
    session_id   VARCHAR(64)  NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_created
    ON chat_messages(user_id, created_at DESC);

CREATE INDEX idx_chat_messages_session
    ON chat_messages(user_id, session_id, created_at DESC);
