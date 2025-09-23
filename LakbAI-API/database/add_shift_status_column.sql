-- Add shift_status column to users table
USE `lakbai_db`;

-- Add shift_status column if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `shift_status` ENUM('on_shift','off_shift','available','busy','offline') DEFAULT 'off_shift' AFTER `license_status`;

-- Add last_active column if it doesn't exist  
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `last_active` TIMESTAMP NULL AFTER `shift_status`;

-- Add indexes for better performance
ALTER TABLE `users` 
ADD INDEX IF NOT EXISTS `idx_shift_status` (`shift_status`),
ADD INDEX IF NOT EXISTS `idx_last_active` (`last_active`);

-- Update existing drivers to have off_shift status
UPDATE `users` 
SET `shift_status` = 'off_shift' 
WHERE `user_type` = 'driver' AND `shift_status` IS NULL;
