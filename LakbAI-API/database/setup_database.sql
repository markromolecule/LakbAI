-- =============================================
-- LakbAI Complete Database Setup Script
-- =============================================
-- This script creates the complete LakbAI database schema
-- Run this script to set up the database from scratch

-- Create database
CREATE DATABASE IF NOT EXISTS `lakbai_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `lakbai_db`;

-- =============================================
-- 1. USERS TABLE
-- =============================================
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `auth0_id` VARCHAR(255) DEFAULT NULL,
    `username` VARCHAR(255) DEFAULT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `email_verified` TINYINT(1) DEFAULT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `nickname` VARCHAR(255) DEFAULT NULL,
    `picture` TEXT DEFAULT NULL,
    `provider` VARCHAR(100) DEFAULT NULL,
    `connection` VARCHAR(100) DEFAULT NULL,
    `password` VARCHAR(255) DEFAULT NULL,
    `first_name` VARCHAR(255) DEFAULT NULL,
    `last_name` VARCHAR(255) DEFAULT NULL,
    `phone_number` VARCHAR(20) DEFAULT NULL,
    `birthday` DATE DEFAULT NULL,
    `gender` ENUM('Male','Female') DEFAULT NULL,
    `house_number` VARCHAR(255) DEFAULT NULL,
    `street_name` VARCHAR(255) DEFAULT NULL,
    `barangay` VARCHAR(255) DEFAULT NULL,
    `city_municipality` VARCHAR(255) DEFAULT NULL,
    `province` VARCHAR(255) DEFAULT NULL,
    `postal_code` VARCHAR(255) DEFAULT NULL,
    `address` LONGTEXT DEFAULT NULL,
    `user_type` ENUM('passenger','driver','admin') DEFAULT NULL,
    `roles` LONGTEXT DEFAULT NULL,
    `is_verified` TINYINT(1) DEFAULT NULL,
    `profile_completed` TINYINT(1) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_active` TIMESTAMP NULL DEFAULT NULL,
    `notification_preferences` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`)),
    `push_notifications_enabled` TINYINT(1) DEFAULT 1,
    `discount_type` ENUM('PWD','Senior Citizen','Student') DEFAULT NULL,
    `discount_document_path` VARCHAR(255) DEFAULT NULL,
    `discount_document_name` VARCHAR(255) DEFAULT NULL,
    `discount_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `discount_rejection_reason` TEXT DEFAULT NULL,
    
    -- Keys and Indexes
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`),
    UNIQUE KEY `phone_number` (`phone_number`),
    UNIQUE KEY `auth0_id` (`auth0_id`),
    KEY `idx_email` (`email`),
    KEY `idx_username` (`username`),
    KEY `idx_phone` (`phone_number`),
    KEY `idx_user_type` (`user_type`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_auth0_id` (`auth0_id`),
    KEY `idx_email_auth0` (`email`),
    KEY `idx_users_push_enabled` (`push_notifications_enabled`),
    KEY `idx_provider` (`provider`),
    KEY `idx_connection` (`connection`),
    KEY `idx_discount_type` (`discount_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. ROUTES TABLE
-- =============================================
DROP TABLE IF EXISTS `routes`;

CREATE TABLE `routes` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `route_name` VARCHAR(100) NOT NULL,
    `origin` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    
    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `route_name` (`route_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. CHECKPOINTS TABLE
-- =============================================
DROP TABLE IF EXISTS `checkpoints`;

CREATE TABLE `checkpoints` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `route_id` INT(11) NOT NULL,
    `checkpoint_name` VARCHAR(100) NOT NULL,
    `sequence_order` INT(3) NOT NULL,
    `fare_from_origin` DECIMAL(8,2) DEFAULT 8.00,
    `is_origin` TINYINT(1) DEFAULT 0,
    `is_destination` TINYINT(1) DEFAULT 0,
    `status` ENUM('active','inactive') DEFAULT 'active',
    
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

-- =============================================
-- 4. DRIVERS TABLE
-- =============================================
DROP TABLE IF EXISTS `drivers`;

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

-- =============================================
-- 5. PASSENGERS TABLE
-- =============================================
DROP TABLE IF EXISTS `passengers`;

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

-- =============================================
-- 6. JEEPNEYS TABLE
-- =============================================
DROP TABLE IF EXISTS `jeepneys`;

CREATE TABLE `jeepneys` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `jeepney_number` VARCHAR(20) NOT NULL,
    `plate_number` VARCHAR(20) NOT NULL,
    `model` VARCHAR(50) DEFAULT NULL,
    `capacity` INT(3) NOT NULL DEFAULT 20,
    `route_id` INT(11) DEFAULT NULL,
    `driver_id` INT(11) DEFAULT NULL,
    `status` ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `jeepney_number` (`jeepney_number`),
    UNIQUE KEY `plate_number` (`plate_number`),
    INDEX `idx_route_id` (`route_id`),
    INDEX `idx_driver_id` (`driver_id`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_jeepneys_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_jeepneys_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. PUSH NOTIFICATION TOKENS TABLE
-- =============================================
DROP TABLE IF EXISTS `push_notification_tokens`;

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

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert sample routes
INSERT INTO `routes` (`route_name`, `origin`, `destination`) VALUES
('SM Epza → SM Dasmariñas', 'SM Epza', 'SM Dasmariñas'),
('SM Dasmariñas → SM Epza', 'SM Dasmariñas', 'SM Epza');

-- Insert sample checkpoints for Route 1: SM Epza → SM Dasmariñas
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

-- Insert sample checkpoints for Route 2: SM Dasmariñas → SM Epza (reverse order)
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

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Show all tables
SHOW TABLES;

-- Show table counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'routes' as table_name, COUNT(*) as record_count FROM routes
UNION ALL
SELECT 
    'checkpoints' as table_name, COUNT(*) as record_count FROM checkpoints
UNION ALL
SELECT 
    'drivers' as table_name, COUNT(*) as record_count FROM drivers
UNION ALL
SELECT 
    'passengers' as table_name, COUNT(*) as record_count FROM passengers
UNION ALL
SELECT 
    'jeepneys' as table_name, COUNT(*) as record_count FROM jeepneys
UNION ALL
SELECT 
    'push_notification_tokens' as table_name, COUNT(*) as record_count FROM push_notification_tokens;

-- Show foreign key relationships
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    CONSTRAINT_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = 'lakbai_db' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- =============================================
-- SETUP COMPLETE
-- =============================================
SELECT 'LakbAI Database Setup Complete!' as status;
