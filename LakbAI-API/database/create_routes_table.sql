-- =============================================
-- Routes Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `routes`;

-- Create routes table
CREATE TABLE `routes` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `route_name` VARCHAR(100) NOT NULL UNIQUE,
    `origin` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `fare_base` DECIMAL(8,2) DEFAULT 8.00,
    `status` ENUM('active', 'inactive') DEFAULT 'active',

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_route_name` (`route_name`),
    INDEX `idx_origin` (`origin`),
    INDEX `idx_destination` (`destination`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample routes
INSERT INTO `routes` (`route_name`, `origin`, `destination`, `description`, `fare_base`) VALUES
('Robinson Tejero - Robinson Pala-pala', 'Robinson Tejero', 'Robinson Pala-pala', 'Main route connecting Robinson malls', 8.00),
('Ayala Center - Lahug', 'Ayala Center Cebu', 'Lahug', 'Business district to residential area', 8.00),
('SM City Cebu - IT Park', 'SM City Cebu', 'IT Park', 'Shopping center to business district', 8.00),
('Colon Street - USC Main', 'Colon Street', 'USC Main Campus', 'Historic downtown to university', 8.00),
('Fuente Circle - Capitol Site', 'Fuente Circle', 'Capitol Site', 'Central area to government district', 8.00),
('Ayala Center - SM City Cebu', 'Ayala Center Cebu', 'SM City Cebu', 'Major shopping centers connection', 8.00),
('Lahug - IT Park', 'Lahug', 'IT Park', 'Residential to business district', 8.00),
('USC Main - Ayala Center', 'USC Main Campus', 'Ayala Center Cebu', 'University to business district', 8.00);
