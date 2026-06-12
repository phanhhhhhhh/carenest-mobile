-- CareNest: Add notification_preferences JSONB to users
-- PDF: "JSON column — lưu notification preferences linh hoạt, không cần alter table"

ALTER TABLE users
    ADD COLUMN notification_preferences JSONB NOT NULL DEFAULT '{
        "medicationReminder": true,
        "reminderMinutesBefore": 10,
        "healthAlert": true,
        "familyUpdate": true,
        "quietHoursStart": "22:00",
        "quietHoursEnd": "07:00"
    }';
