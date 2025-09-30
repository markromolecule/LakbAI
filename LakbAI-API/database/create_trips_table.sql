-- =============================================
-- Active Trips Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `active_trips`;

-- Create active_trips table to track passenger trips
CREATE TABLE `active_trips` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `trip_id` VARCHAR(100) NOT NULL UNIQUE,
    `passenger_id` INT(11) NOT NULL,
    `driver_id` INT(11) NOT NULL,
    `route_id` INT(11) NOT NULL,
    `pickup_location` VARCHAR(255) NOT NULL,
    `destination` VARCHAR(255) NOT NULL,
    `fare` DECIMAL(10,2) NOT NULL,
    `status` ENUM('booked', 'in_progress', 'completed', 'cancelled') DEFAULT 'booked',
    `booked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_trip_id` (`trip_id`),
    KEY `idx_passenger_id` (`passenger_id`),
    KEY `idx_driver_id` (`driver_id`),
    KEY `idx_route_id` (`route_id`),
    KEY `idx_status` (`status`),
    KEY `idx_booked_at` (`booked_at`),
    
    -- Foreign key constraints
    FOREIGN KEY (`passenger_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX `idx_driver_status` ON `active_trips` (`driver_id`, `status`);
CREATE INDEX `idx_passenger_status` ON `active_trips` (`passenger_id`, `status`);
CREATE INDEX `idx_route_status` ON `active_trips` (`route_id`, `status`);
