-- =============================================
-- Driver Earnings Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `driver_earnings`;

-- Create driver_earnings table
CREATE TABLE `driver_earnings` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `driver_id` INT(11) NOT NULL,
    `trip_id` VARCHAR(100) NOT NULL,
    `passenger_id` VARCHAR(100) NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `original_fare` DECIMAL(10,2) NOT NULL,
    `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
    `final_fare` DECIMAL(10,2) NOT NULL,
    `payment_method` VARCHAR(50) DEFAULT 'xendit',
    `pickup_location` VARCHAR(255) NULL,
    `destination` VARCHAR(255) NULL,
    `transaction_date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_trip_id` (`trip_id`),
    KEY `idx_driver_id` (`driver_id`),
    KEY `idx_transaction_date` (`transaction_date`),
    KEY `idx_created_at` (`created_at`),
    
    -- Foreign key constraint
    FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO `driver_earnings` (`driver_id`, `trip_id`, `passenger_id`, `amount`, `original_fare`, `discount_amount`, `final_fare`, `payment_method`, `pickup_location`, `destination`, `transaction_date`) VALUES
(16, 'trip_sample_001', 'passenger_001', 25.00, 30.00, 5.00, 25.00, 'xendit', 'Robinson Tejero', 'Ayala Center', CURDATE()),
(16, 'trip_sample_002', 'passenger_002', 15.00, 15.00, 0.00, 15.00, 'xendit', 'SM City Cebu', 'IT Park', CURDATE());

-- Create indexes for performance
CREATE INDEX `idx_driver_date` ON `driver_earnings` (`driver_id`, `transaction_date`);
CREATE INDEX `idx_driver_created` ON `driver_earnings` (`driver_id`, `created_at`);
