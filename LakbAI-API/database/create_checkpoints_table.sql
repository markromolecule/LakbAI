-- =============================================
-- Checkpoints Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `checkpoints`;

-- Create checkpoints table
CREATE TABLE `checkpoints` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `route_id` INT(11) NOT NULL,
    `checkpoint_name` VARCHAR(100) NOT NULL,
    `sequence_order` INT(3) NOT NULL,
    `fare_from_origin` DECIMAL(8,2) DEFAULT 8.00,
    `is_origin` TINYINT(1) DEFAULT 0,
    `is_destination` TINYINT(1) DEFAULT 0,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    INDEX `idx_route_id` (`route_id`),
    INDEX `idx_sequence` (`route_id`, `sequence_order`),
    CONSTRAINT `fk_checkpoint_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample checkpoints for the two main routes
-- Route 1: SM Epza → SM Dasmariñas
INSERT INTO `checkpoints` (`route_id`, `checkpoint_name`, `sequence_order`, `fare_from_origin`, `is_origin`, `is_destination`) VALUES
(1, 'SM Epza', 1, 0.00, 1, 0),
(1, 'Robinson Tejero', 2, 8.00, 0, 0),
(1, 'Malabon', 3, 12.00, 0, 0),
(1, 'Riverside', 4, 15.00, 0, 0),
(1, 'Lancaster New City', 5, 18.00, 0, 0),
(1, 'Pasong Camachile I', 6, 20.00, 0, 0),
(1, 'Open Canal', 7, 22.00, 0, 0),
(1, 'Santiago', 8, 25.00, 0, 0),
(1, 'Bella Vista', 9, 28.00, 0, 0),
(1, 'San Francisco', 10, 30.00, 0, 0),
(1, 'Country Meadow', 11, 32.00, 0, 0),
(1, 'Pabahay', 12, 35.00, 0, 0),
(1, 'Monterey', 13, 38.00, 0, 0),
(1, 'Langkaan', 14, 40.00, 0, 0),
(1, 'Tierra Vista', 15, 42.00, 0, 0),
(1, 'Robinson Dasmariñas', 16, 45.00, 0, 0),
(1, 'SM Dasmariñas', 17, 50.00, 0, 1);

-- Route 2: SM Dasmariñas → SM Epza (reverse order)
INSERT INTO `checkpoints` (`route_id`, `checkpoint_name`, `sequence_order`, `fare_from_origin`, `is_origin`, `is_destination`) VALUES
(2, 'SM Dasmariñas', 1, 0.00, 1, 0),
(2, 'Robinson Dasmariñas', 2, 5.00, 0, 0),
(2, 'Tierra Vista', 3, 8.00, 0, 0),
(2, 'Langkaan', 4, 10.00, 0, 0),
(2, 'Monterey', 5, 12.00, 0, 0),
(2, 'Pabahay', 6, 15.00, 0, 0),
(2, 'Country Meadow', 7, 18.00, 0, 0),
(2, 'San Francisco', 8, 20.00, 0, 0),
(2, 'Bella Vista', 9, 22.00, 0, 0),
(2, 'Santiago', 10, 25.00, 0, 0),
(2, 'Open Canal', 11, 28.00, 0, 0),
(2, 'Pasong Camachile I', 12, 30.00, 0, 0),
(2, 'Lancaster New City', 13, 32.00, 0, 0),
(2, 'Riverside', 14, 35.00, 0, 0),
(2, 'Malabon', 15, 38.00, 0, 0),
(2, 'Robinson Tejero', 16, 42.00, 0, 0),
(2, 'SM Epza', 17, 50.00, 0, 1);
