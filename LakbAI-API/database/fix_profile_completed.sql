-- =============================================
-- Fix Profile Completed Field for Existing Users
-- This script ensures all existing users have the correct profile_completed status
-- =============================================

USE `lakbai_db`;

-- First, let's check if the profile_completed column exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'lakbai_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'profile_completed';

-- If the column doesn't exist, add it
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER discount_verified;

-- Now let's check the current status of profile_completed for all users
SELECT 
    id, 
    username, 
    email, 
    first_name, 
    last_name, 
    phone_number, 
    birthday, 
    gender,
    profile_completed,
    created_at
FROM users;

-- Update existing users to have profile_completed = TRUE if they have all required fields
UPDATE users 
SET profile_completed = TRUE 
WHERE first_name IS NOT NULL 
  AND first_name != ''
  AND last_name IS NOT NULL 
  AND last_name != ''
  AND phone_number IS NOT NULL 
  AND phone_number != ''
  AND birthday IS NOT NULL 
  AND gender IS NOT NULL 
  AND gender != ''
  AND house_number IS NOT NULL 
  AND house_number != ''
  AND street_name IS NOT NULL 
  AND street_name != ''
  AND barangay IS NOT NULL 
  AND barangay != ''
  AND city_municipality IS NOT NULL 
  AND city_municipality != ''
  AND province IS NOT NULL 
  AND province != ''
  AND postal_code IS NOT NULL 
  AND postal_code != '';

-- Check the updated status
SELECT 
    id, 
    username, 
    email, 
    profile_completed,
    CASE 
        WHEN profile_completed = 1 THEN 'Complete'
        ELSE 'Incomplete'
    END as status
FROM users;

-- Show users that still have incomplete profiles
SELECT 
    id, 
    username, 
    email, 
    first_name, 
    last_name, 
    phone_number, 
    birthday, 
    gender,
    house_number, 
    street_name, 
    barangay, 
    city_municipality, 
    province, 
    postal_code,
    profile_completed
FROM users 
WHERE profile_completed = FALSE;
