-- =============================================
-- Passengers Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `passengers`;

-- Create passengers table
CREATE TABLE `passengers` (
    `user_id` INT(11) NOT NULL,
    `discount_type` ENUM('PWD','Senior Citizen','Student') DEFAULT NULL,
    `discount_document_path` VARCHAR(255) DEFAULT NULL,
    `discount_document_name` VARCHAR(255) DEFAULT NULL,
    `discount_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `preferred_route` VARCHAR(255) DEFAULT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_passengers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
