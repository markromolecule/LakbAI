-- Add drivers_license field for driver accounts
ALTER TABLE users 
ADD COLUMN drivers_license_path VARCHAR(255) NULL AFTER discount_document_name,
ADD COLUMN drivers_license_name VARCHAR(255) NULL AFTER drivers_license_path,
ADD COLUMN drivers_license_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER drivers_license_name;

-- Add index for driver license verification
ALTER TABLE users 
ADD INDEX idx_drivers_license_verified (drivers_license_verified);

-- Update existing driver accounts to have NULL drivers_license fields
UPDATE users 
SET drivers_license_path = NULL, 
    drivers_license_name = NULL, 
    drivers_license_verified = FALSE 
WHERE user_type = 'driver';
