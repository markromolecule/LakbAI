-- =============================================
-- LakbAI Users Table Creation Script
-- Supports both Passenger and Driver users
-- =============================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `lakbai_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `users`;

-- Create users table
CREATE TABLE `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    
    -- Authentication fields
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    
    -- Personal information
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL UNIQUE,
    `birthday` DATE NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    
    -- Address information (Philippine address structure)
    `house_number` VARCHAR(20) NOT NULL,
    `street_name` VARCHAR(100) NOT NULL,
    `barangay` VARCHAR(100) NOT NULL,
    `city_municipality` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` CHAR(4) NOT NULL,
    
    -- User type and verification
    `user_type` ENUM('passenger', 'driver') NOT NULL DEFAULT 'passenger',
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Discount information (for PWD, Senior Citizens, Students)
    `discount_type` ENUM('PWD', 'Senior Citizen', 'Student') NULL,
    `discount_document_path` VARCHAR(255) NULL,
    `discount_document_name` VARCHAR(255) NULL,
    `discount_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (`id`),
    
    -- Indexes for better performance
    INDEX `idx_email` (`email`),
    INDEX `idx_username` (`username`),
    INDEX `idx_phone` (`phone_number`),
    INDEX `idx_user_type` (`user_type`),
    INDEX `idx_discount_type` (`discount_type`),
    INDEX `idx_created_at` (`created_at`)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sample Data Insertion (Optional)
-- =============================================

-- Uncomment below to insert sample data

-- INSERT INTO `users` (
--     `username`, `email`, `password`, `first_name`, `last_name`, 
--     `phone_number`, `birthday`, `gender`, `house_number`, `street_name`,
--     `barangay`, `city_municipality`, `province`, `postal_code`,
--     `user_type`, `discount_type`, `is_verified`
-- ) VALUES 
-- -- Regular passenger
-- (
--     'juan_dela_cruz', 'juan.delacruz@email.com', 
--     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'Password123'
--     'Juan', 'Dela Cruz', '09123456789', '1990-01-15', 'Male',
--     '123', 'Rizal Street', 'Barangay 1', 'Manila', 'Metro Manila', '1000',
--     'passenger', NULL, TRUE
-- );

-- =============================================
-- Useful Queries for Testing
-- =============================================

-- View all users
-- SELECT * FROM users;

-- View only passengers
-- SELECT * FROM users WHERE user_type = 'passenger';

-- View only drivers
-- SELECT * FROM users WHERE user_type = 'driver';

-- View users with discounts
-- SELECT * FROM users WHERE discount_type IS NOT NULL;

-- View verified users
-- SELECT * FROM users WHERE is_verified = TRUE;

-- Count users by type
-- SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type;

-- Count users by discount type
-- SELECT discount_type, COUNT(*) as count FROM users WHERE discount_type IS NOT NULL GROUP BY discount_type;