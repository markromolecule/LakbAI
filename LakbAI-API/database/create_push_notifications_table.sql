-- =============================================
-- Push Notification Tokens Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `push_notification_tokens`;

-- Create push_notification_tokens table
CREATE TABLE `push_notification_tokens` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NOT NULL,
    `token` TEXT NOT NULL,
    `user_type` ENUM('driver','passenger') NOT NULL,
    `device_id` VARCHAR(255) DEFAULT NULL,
    `platform` ENUM('ios','android','expo') NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_token` (`token`(255)),
    INDEX `idx_user_type` (`user_type`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
