-- =============================================
-- Add discount_amount field to users table
-- =============================================

USE `lakbai_db`;

-- Add discount_amount column to users table
ALTER TABLE `users` 
ADD COLUMN `discount_amount` DECIMAL(10,2) NULL DEFAULT NULL AFTER `discount_status`;

-- Add index for discount amount for better query performance
ALTER TABLE `users` 
ADD INDEX `idx_discount_amount` (`discount_amount`);

-- Update existing approved discount records to have a default amount
-- (You can customize these amounts based on your business rules)
UPDATE `users` 
SET `discount_amount` = CASE 
    WHEN `discount_type` = 'Senior Citizen' THEN 5.00
    WHEN `discount_type` = 'PWD' THEN 5.00
    WHEN `discount_type` = 'Student' THEN 3.00
    ELSE NULL
END
WHERE `discount_status` = 'approved' AND `discount_type` IS NOT NULL;

-- =============================================
-- Verification Queries
-- =============================================

-- Check the new structure
DESCRIBE `users`;

-- View users with discount applications including amount
SELECT 
    id, username, first_name, last_name, 
    discount_type, discount_applied, discount_status, discount_amount,
    discount_file_path, discount_verified
FROM `users` 
WHERE `discount_type` IS NOT NULL 
ORDER BY `created_at` DESC;
