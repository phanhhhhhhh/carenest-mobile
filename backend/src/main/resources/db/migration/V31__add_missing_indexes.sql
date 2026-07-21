-- V31: indexes for hot query paths that were missing coverage.

-- OTP cleanup sweeps filter by expiry.
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- Unread notification counts/badges filter on user_id + read_at IS NULL.
-- (The table has no boolean `read` column — unread is represented as read_at IS NULL.)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;

-- Prevent a user from ever having two concurrently ACTIVE subscriptions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user ON subscriptions(user_id) WHERE status = 'ACTIVE';
