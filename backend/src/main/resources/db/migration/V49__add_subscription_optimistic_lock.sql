-- CareNest: optimistic locking for Subscription to close a lost-update race
-- between concurrent confirm/reject of the same manual (VietQR) payment.
ALTER TABLE subscriptions ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
