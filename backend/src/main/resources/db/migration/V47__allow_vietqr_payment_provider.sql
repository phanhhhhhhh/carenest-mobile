-- CareNest: allow the VIETQR payment provider (manual reconciliation, UC G3).
-- PaymentService.createVietQrPayment / confirmManualPayment persist provider = 'VIETQR',
-- which the original V20 CHECK ('VNPAY', 'MOMO', 'MANUAL') rejected.

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_provider_check
    CHECK (payment_provider IN ('VNPAY', 'MOMO', 'MANUAL', 'VIETQR'));
