-- =============================================
-- Jeepney Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `jeepneys`;

-- Create jeepneys table
CREATE TABLE `jeepneys` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `jeepney_number` VARCHAR(20) NOT NULL UNIQUE,
    `plate_number` VARCHAR(20) NOT NULL UNIQUE,
    `capacity` INT(3) NOT NULL DEFAULT 20,
    `route_id` INT(11) NULL,
    `driver_id` INT(11) NULL,
    `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_plate` (`plate_number`),
    UNIQUE KEY `uk_jeepney_number` (`jeepney_number`),
    INDEX `idx_route_id` (`route_id`),
    CONSTRAINT `fk_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
