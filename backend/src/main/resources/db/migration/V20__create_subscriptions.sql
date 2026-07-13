-- CareNest: Subscriptions — premium plan management (UC-25)

CREATE TABLE subscriptions (
    id               BIGSERIAL    PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type        VARCHAR(30)  NOT NULL CHECK (plan_type IN (
                         'FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY'
                     )),
    status           VARCHAR(20)  NOT NULL CHECK (status IN (
                         'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'
                     )),
    payment_provider VARCHAR(20)  NULL CHECK (payment_provider IN ('VNPAY', 'MOMO', 'MANUAL')),
    transaction_id   VARCHAR(100) NULL,
    amount           DECIMAL(12,0) NULL,
    start_date       TIMESTAMPTZ  NOT NULL,
    end_date         TIMESTAMPTZ  NULL,
    cancelled_at     TIMESTAMPTZ  NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_status
    ON subscriptions(user_id, status);
