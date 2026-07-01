ALTER TABLE elderly_profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE elderly_profiles ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE elderly_profiles ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2);
ALTER TABLE elderly_profiles ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5, 1);
