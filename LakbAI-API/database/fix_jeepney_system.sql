-- =============================================
-- Complete Fix for Jeepney Management System
-- =============================================

USE `lakbai_db`;

-- 1. Create routes table if it doesn't exist
CREATE TABLE IF NOT EXISTS `routes` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `route_name` VARCHAR(100) NOT NULL UNIQUE,
    `origin` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `fare_base` DECIMAL(8,2) DEFAULT 8.00,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_route_name` (`route_name`),
    INDEX `idx_origin` (`origin`),
    INDEX `idx_destination` (`destination`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert routes if table is empty
INSERT IGNORE INTO `routes` (`route_name`, `origin`, `destination`, `description`, `fare_base`) VALUES
('Robinson Tejero - Robinson Pala-pala', 'Robinson Tejero', 'Robinson Pala-pala', 'Main route connecting Robinson malls', 8.00),
('Ayala Center - Lahug', 'Ayala Center Cebu', 'Lahug', 'Business district to residential area', 8.00),
('SM City Cebu - IT Park', 'SM City Cebu', 'IT Park', 'Shopping center to business district', 8.00),
('Colon Street - USC Main', 'Colon Street', 'USC Main Campus', 'Historic downtown to university', 8.00),
('Fuente Circle - Capitol Site', 'Fuente Circle', 'Capitol Site', 'Central area to government district', 8.00),
('Ayala Center - SM City Cebu', 'Ayala Center Cebu', 'SM City Cebu', 'Major shopping centers connection', 8.00),
('Lahug - IT Park', 'Lahug', 'IT Park', 'Residential to business district', 8.00),
('USC Main - Ayala Center', 'USC Main Campus', 'Ayala Center Cebu', 'University to business district', 8.00);

-- 3. Ensure jeepneys table exists with proper structure
CREATE TABLE IF NOT EXISTS `jeepneys` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `plate_number` VARCHAR(20) NOT NULL UNIQUE,
    `route` VARCHAR(100) NOT NULL,
    `capacity` INT(3) NOT NULL DEFAULT 20,
    `driver_id` INT(11) NULL,
    `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_plate` (`plate_number`),
    INDEX `idx_route` (`route`),
    INDEX `idx_driver` (`driver_id`),
    CONSTRAINT `fk_jeepney_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ensure users table has driver fields
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `drivers_license_name` VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS `license_status` ENUM('active', 'suspended', 'expired', 'pending') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS `shift_status` ENUM('available', 'busy', 'offline') DEFAULT 'offline';

-- 5. Insert some test drivers if none exist
INSERT IGNORE INTO `users` (
    `username`, `email`, `password`, `first_name`, `last_name`, `phone_number`, 
    `birthday`, `gender`, `house_number`, `street_name`, `barangay`, 
    `city_municipality`, `province`, `postal_code`, `user_type`, `is_verified`,
    `drivers_license_name`, `license_status`, `shift_status`
) VALUES
('driver1', 'juan.delacruz@lakbai.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Dela Cruz', '09123456789', 
 '1990-01-15', 'Male', '123', 'Main Street', 'Barangay 1', 'Cebu City', 'Cebu', '6000', 'driver', TRUE,
 'D123-456-789', 'active', 'available'),
('driver2', 'maria.santos@lakbai.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria', 'Santos', '09987654321', 
 '1985-05-20', 'Female', '456', 'Oak Avenue', 'Barangay 2', 'Cebu City', 'Cebu', '6000', 'driver', TRUE,
 'D987-654-321', 'active', 'available'),
('driver3', 'pedro.garcia@lakbai.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro', 'Garcia', '09171234567', 
 '1988-12-10', 'Male', '789', 'Pine Street', 'Barangay 3', 'Cebu City', 'Cebu', '6000', 'driver', TRUE,
 'D555-666-777', 'active', 'available');

-- 6. Insert some test jeepneys if none exist
INSERT IGNORE INTO `jeepneys` (`plate_number`, `route`, `capacity`, `driver_id`, `status`) VALUES
('ABC-1234', 'Robinson Tejero - Robinson Pala-pala', 20, 1, 'active'),
('DEF-5678', 'Ayala Center - Lahug', 18, 2, 'active'),
('GHI-9012', 'SM City Cebu - IT Park', 22, NULL, 'active');

-- 7. Show summary
SELECT 'Routes created:' as info, COUNT(*) as count FROM routes
UNION ALL
SELECT 'Drivers created:', COUNT(*) FROM users WHERE user_type = 'driver'
UNION ALL
SELECT 'Jeepneys created:', COUNT(*) FROM jeepneys;
