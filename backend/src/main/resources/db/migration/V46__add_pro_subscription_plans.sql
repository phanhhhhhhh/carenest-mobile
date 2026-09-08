-- CareNest: Support Pro Subscription Plans (PRO_MONTHLY, PRO_YEARLY)

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check
    CHECK (plan_type IN ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY', 'PRO_MONTHLY', 'PRO_YEARLY'));
