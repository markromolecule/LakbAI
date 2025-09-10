-- =============================================
-- Update Users Table - Add New Discount Fields
-- =============================================

USE `lakbai_db`;

-- Add new discount-related columns to users table
ALTER TABLE `users` 
ADD COLUMN `discount_applied` BOOLEAN NOT NULL DEFAULT FALSE AFTER `discount_type`,
ADD COLUMN `discount_file_path` VARCHAR(500) NULL AFTER `discount_applied`,
ADD COLUMN `discount_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER `discount_file_path`;

-- Add index for discount status for better query performance
ALTER TABLE `users` 
ADD INDEX `idx_discount_status` (`discount_status`);

-- Update existing records to set discount_applied based on discount_type
UPDATE `users` 
SET `discount_applied` = TRUE 
WHERE `discount_type` IS NOT NULL AND `discount_type` != '';

-- Update existing records to set discount_status based on discount_verified
UPDATE `users` 
SET `discount_status` = CASE 
    WHEN `discount_verified` = 1 THEN 'approved'
    WHEN `discount_type` IS NOT NULL AND `discount_type` != '' AND `discount_verified` = 0 THEN 'pending'
    ELSE 'pending'
END
WHERE `discount_type` IS NOT NULL AND `discount_type` != '';

-- =============================================
-- Verification Queries
-- =============================================

-- Check the new structure
DESCRIBE `users`;

-- View users with discount applications
SELECT 
    id, username, first_name, last_name, 
    discount_type, discount_applied, discount_status, 
    discount_file_path, discount_verified
FROM `users` 
WHERE `discount_type` IS NOT NULL 
ORDER BY `created_at` DESC;
