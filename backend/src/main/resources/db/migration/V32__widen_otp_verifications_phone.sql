-- otp_verifications.phone actually stores a generic "target" (phone OR email,
-- see OtpService), but was sized for phone numbers only (VARCHAR(20)) and
-- overflows on real email addresses. Widen to match email max length used
-- elsewhere in the schema (RegisterRequest.email is validated to <= 255).

ALTER TABLE otp_verifications ALTER COLUMN phone TYPE VARCHAR(255);
