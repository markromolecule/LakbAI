USE `lakbai_db`;

-- Create shift logs table to track driver shifts
DROP TABLE IF EXISTS `driver_shift_logs`;
CREATE TABLE `driver_shift_logs` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `driver_id` INT(11) NOT NULL,
    `shift_date` DATE NOT NULL,
    `start_time` TIMESTAMP NULL,
    `end_time` TIMESTAMP NULL,
    `total_earnings` DECIMAL(10,2) DEFAULT 0.00,
    `total_trips` INT(11) DEFAULT 0,
    `status` ENUM('active', 'ended') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_driver_id` (`driver_id`),
    INDEX `idx_shift_date` (`shift_date`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a sample active shift for driver 16
INSERT INTO `driver_shift_logs` (`driver_id`, `shift_date`, `start_time`, `status`) VALUES
(16, CURDATE(), NOW(), 'active');
