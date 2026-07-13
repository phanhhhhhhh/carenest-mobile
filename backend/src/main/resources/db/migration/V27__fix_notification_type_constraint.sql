-- Add FAMILY_LINK_REQUEST to the notification type check constraint

ALTER TABLE notifications
    DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
        'MEDICATION_REMINDER',
        'HEALTH_ALERT',
        'EMERGENCY',
        'APPOINTMENT_REMINDER',
        'FAMILY_UPDATE',
        'FAMILY_LINK_REQUEST'
    ));
