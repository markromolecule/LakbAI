-- =============================================
-- Drivers Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `drivers`;

-- Create drivers table
CREATE TABLE `drivers` (
    `user_id` INT(11) NOT NULL,
    `drivers_license_path` VARCHAR(255) DEFAULT NULL,
    `drivers_license_name` VARCHAR(255) DEFAULT NULL,
    `drivers_license_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `license_status` ENUM('pending','approved','rejected','active','suspended','expired') DEFAULT 'pending',
    `shift_status` ENUM('on_shift','off_shift','available','busy','offline') DEFAULT 'off_shift',
    `current_location` VARCHAR(255) DEFAULT NULL,
    `preferred_route` VARCHAR(255) DEFAULT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_drivers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
