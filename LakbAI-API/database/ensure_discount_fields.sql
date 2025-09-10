-- =============================================
-- Ensure Discount Application Fields Exist
-- This script ensures all necessary fields for discount applications exist
-- =============================================

USE `lakbai_db`;

-- Add discount_applied field if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'discount_applied') = 0,
    'ALTER TABLE `users` ADD COLUMN `discount_applied` BOOLEAN NOT NULL DEFAULT FALSE AFTER `discount_type`',
    'SELECT "discount_applied column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_file_path field if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'discount_file_path') = 0,
    'ALTER TABLE `users` ADD COLUMN `discount_file_path` VARCHAR(500) NULL AFTER `discount_applied`',
    'SELECT "discount_file_path column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_status field if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'discount_status') = 0,
    'ALTER TABLE `users` ADD COLUMN `discount_status` ENUM(\'pending\', \'approved\', \'rejected\') NOT NULL DEFAULT \'pending\' AFTER `discount_file_path`',
    'SELECT "discount_status column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_amount field if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'discount_amount') = 0,
    'ALTER TABLE `users` ADD COLUMN `discount_amount` DECIMAL(10,2) NULL DEFAULT NULL AFTER `discount_status`',
    'SELECT "discount_amount column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND INDEX_NAME = 'idx_discount_status') = 0,
    'ALTER TABLE `users` ADD INDEX `idx_discount_status` (`discount_status`)',
    'SELECT "idx_discount_status index already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'lakbai_db' 
     AND TABLE_NAME = 'users' 
     AND INDEX_NAME = 'idx_discount_amount') = 0,
    'ALTER TABLE `users` ADD INDEX `idx_discount_amount` (`discount_amount`)',
    'SELECT "idx_discount_amount index already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to set discount_applied based on discount_type
UPDATE `users` 
SET `discount_applied` = TRUE 
WHERE `discount_type` IS NOT NULL AND `discount_type` != '' AND `discount_applied` = FALSE;

-- Update existing records to set discount_status based on discount_verified
UPDATE `users` 
SET `discount_status` = CASE 
    WHEN `discount_verified` = 1 THEN 'approved'
    WHEN `discount_type` IS NOT NULL AND `discount_type` != '' AND `discount_verified` = 0 THEN 'pending'
    ELSE 'pending'
END
WHERE `discount_type` IS NOT NULL AND `discount_type` != '' AND `discount_status` = 'pending' AND `discount_verified` != 0;

-- =============================================
-- Verification Queries
-- =============================================

-- Check the final structure
DESCRIBE `users`;

-- Show discount-related columns specifically
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'lakbai_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE '%discount%'
ORDER BY ORDINAL_POSITION;

-- View users with discount applications
SELECT 
    id, username, first_name, last_name, 
    discount_type, discount_applied, discount_status, discount_amount,
    discount_file_path, discount_document_path, discount_document_name,
    discount_verified, created_at, updated_at
FROM `users` 
WHERE `discount_type` IS NOT NULL 
ORDER BY `updated_at` DESC;
