-- CareNest v3.5: Camera Consent Onboarding (UC D1) + timed Privacy Mode (UC D7)
--
-- D1: the elderly person must explicitly accept camera monitoring before any
-- camera can be linked. Declining keeps the camera fully off and schedules at
-- most one re-ask 30 days later; every non-camera feature keeps working.
--
-- D7: Privacy Mode is a *temporary* pause (1 or 2 hours). We store its expiry so
-- a scheduler can restore monitoring and tell the family that it resumed.

ALTER TABLE elderly_profiles
    ADD COLUMN IF NOT EXISTS camera_consent_status VARCHAR(12) NOT NULL DEFAULT 'PENDING'
        CHECK (camera_consent_status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    ADD COLUMN IF NOT EXISTS camera_consent_decided_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS camera_consent_retry_after TIMESTAMPTZ;

-- Existing deployments already linked cameras under the old (implicit-consent)
-- flow — treat a profile that already owns a camera as having accepted.
UPDATE elderly_profiles p
   SET camera_consent_status = 'ACCEPTED',
       camera_consent_decided_at = NOW()
 WHERE p.camera_consent_status = 'PENDING'
   AND EXISTS (SELECT 1 FROM camera_devices d WHERE d.elderly_id = p.user_id);

ALTER TABLE camera_devices
    ADD COLUMN IF NOT EXISTS privacy_mode_expires_at TIMESTAMPTZ;
