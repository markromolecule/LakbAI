-- =============================================
-- LakbAI Users Table Auth0 Integration Update
-- Adds Auth0-specific fields for hybrid authentication
-- =============================================

USE `lakbai_db`;

-- Add Auth0-specific fields
ALTER TABLE users 
ADD COLUMN auth0_id VARCHAR(255) NULL AFTER id,
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER email,
ADD COLUMN name VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN nickname VARCHAR(100) NULL AFTER name,
ADD COLUMN picture TEXT NULL AFTER nickname,
ADD COLUMN provider VARCHAR(50) NULL AFTER picture,
ADD COLUMN connection VARCHAR(50) NULL AFTER provider,
ADD COLUMN roles JSON NULL AFTER user_type,
ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER discount_verified,
ADD COLUMN license_status ENUM('active', 'suspended', 'expired', 'pending') NULL AFTER profile_completed,
ADD COLUMN shift_status ENUM('available', 'busy', 'offline') NULL AFTER license_status,
ADD COLUMN last_active TIMESTAMP NULL AFTER shift_status;

-- Add indexes for Auth0 fields
ALTER TABLE users 
ADD INDEX idx_auth0_id (auth0_id),
ADD INDEX idx_provider (provider),
ADD INDEX idx_profile_completed (profile_completed),
ADD INDEX idx_license_status (license_status),
ADD INDEX idx_shift_status (shift_status),
ADD INDEX idx_last_active (last_active);

-- Update existing users to have profile_completed = TRUE if they have required fields
UPDATE users 
SET profile_completed = TRUE 
WHERE first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND phone_number IS NOT NULL 
  AND birthday IS NOT NULL 
  AND gender IS NOT NULL 
  AND house_number IS NOT NULL 
  AND street_name IS NOT NULL 
  AND barangay IS NOT NULL 
  AND city_municipality IS NOT NULL 
  AND province IS NOT NULL 
  AND postal_code IS NOT NULL;

-- Set default values for existing users
UPDATE users 
SET email_verified = TRUE,
    provider = 'traditional',
    connection = 'database',
    roles = '["user"]'
WHERE auth0_id IS NULL;

-- Add unique constraint for auth0_id (but allow NULL for traditional users)
ALTER TABLE users 
ADD UNIQUE INDEX unique_auth0_id (auth0_id);

-- Update the unique constraint for email to allow multiple users with same email if one is Auth0
-- (This will be handled in the application logic)
