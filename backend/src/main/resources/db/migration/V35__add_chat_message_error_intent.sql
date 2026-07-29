-- CareNest: allow a distinguishable 'ERROR' intent value on chat_messages so a genuine
-- Gemini API failure (bad key, timeout, safety block, malformed response) can be flagged
-- and rendered differently from a real AI reply, instead of being stored/returned as one.

ALTER TABLE chat_messages
    DROP CONSTRAINT chat_messages_intent_check;

ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_intent_check CHECK (intent IN (
        'HEALTH', 'MEDICATION', 'APPOINTMENT', 'GENERAL', 'REMINDER', 'ERROR'
    ));
