-- =============================================
-- Simplified Dynamic Fare Matrix Table Creation Script
-- =============================================

USE `lakbai_db`;

-- Drop table if exists (for fresh creation)
DROP TABLE IF EXISTS `fare_matrix`;

-- Create fare_matrix table
CREATE TABLE `fare_matrix` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `from_checkpoint_id` INT(11) NOT NULL,
    `to_checkpoint_id` INT(11) NOT NULL,
    `fare_amount` DECIMAL(8,2) NOT NULL,
    `route_id` INT(11) NOT NULL,
    `is_base_fare` TINYINT(1) DEFAULT 0,
    `effective_date` DATE DEFAULT (CURRENT_DATE),
    `expiry_date` DATE DEFAULT NULL,
    `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_fare_route` (`from_checkpoint_id`, `to_checkpoint_id`, `route_id`, `effective_date`),
    INDEX `idx_from_checkpoint` (`from_checkpoint_id`),
    INDEX `idx_to_checkpoint` (`to_checkpoint_id`),
    INDEX `idx_route_id` (`route_id`),
    INDEX `idx_effective_date` (`effective_date`),
    INDEX `idx_status` (`status`),
    
    -- Foreign Keys
    CONSTRAINT `fk_fare_from_checkpoint` FOREIGN KEY (`from_checkpoint_id`) REFERENCES `checkpoints` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_fare_to_checkpoint` FOREIGN KEY (`to_checkpoint_id`) REFERENCES `checkpoints` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_fare_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create fare_matrix_history table for audit trail
CREATE TABLE `fare_matrix_history` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `fare_matrix_id` INT(11) NOT NULL,
    `from_checkpoint_id` INT(11) NOT NULL,
    `to_checkpoint_id` INT(11) NOT NULL,
    `old_fare_amount` DECIMAL(8,2),
    `new_fare_amount` DECIMAL(8,2) NOT NULL,
    `route_id` INT(11) NOT NULL,
    `change_type` ENUM('created', 'updated', 'deleted', 'activated', 'deactivated') NOT NULL,
    `changed_by` VARCHAR(100) DEFAULT 'system',
    `change_reason` TEXT,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Keys
    PRIMARY KEY (`id`),
    INDEX `idx_fare_matrix_id` (`fare_matrix_id`),
    INDEX `idx_change_type` (`change_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert base fare matrix data for existing routes
-- Route 1: SM Epza → SM Dasmariñas (Route ID 1)
-- Route 2: SM Dasmariñas → SM Epza (Route ID 2)

-- Insert fare matrix for Route 1 (SM Epza → SM Dasmariñas)
-- Base fare: 13 (as specified by user)

-- Get checkpoints for Route 1 and create fare matrix
INSERT INTO fare_matrix (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date)
SELECT 
    c1.id as from_checkpoint_id,
    c2.id as to_checkpoint_id,
    CASE 
        WHEN c1.id = c2.id THEN 13.00  -- Base fare for same checkpoint
        ELSE 13.00 + (ABS(c2.sequence_order - c1.sequence_order) * 2.5)  -- Distance-based fare
    END as fare_amount,
    1 as route_id,
    CASE WHEN c1.id = c2.id THEN 1 ELSE 0 END as is_base_fare,
    CURRENT_DATE as effective_date
FROM checkpoints c1
CROSS JOIN checkpoints c2
WHERE c1.route_id = 1 AND c2.route_id = 1 AND c1.status = 'active' AND c2.status = 'active';

-- Insert fare matrix for Route 2 (SM Dasmariñas → SM Epza)
INSERT INTO fare_matrix (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date)
SELECT 
    c1.id as from_checkpoint_id,
    c2.id as to_checkpoint_id,
    CASE 
        WHEN c1.id = c2.id THEN 13.00  -- Base fare for same checkpoint
        ELSE 13.00 + (ABS(c2.sequence_order - c1.sequence_order) * 2.5)  -- Distance-based fare
    END as fare_amount,
    2 as route_id,
    CASE WHEN c1.id = c2.id THEN 1 ELSE 0 END as is_base_fare,
    CURRENT_DATE as effective_date
FROM checkpoints c1
CROSS JOIN checkpoints c2
WHERE c1.route_id = 2 AND c2.route_id = 2 AND c1.status = 'active' AND c2.status = 'active';

-- Create indexes for better performance
CREATE INDEX `idx_fare_lookup` ON `fare_matrix` (`from_checkpoint_id`, `to_checkpoint_id`, `route_id`, `status`, `effective_date`);

-- Create a view for easy fare lookup
CREATE VIEW `fare_matrix_view` AS
SELECT 
    fm.id,
    fm.from_checkpoint_id,
    c1.checkpoint_name as from_checkpoint_name,
    fm.to_checkpoint_id,
    c2.checkpoint_name as to_checkpoint_name,
    fm.fare_amount,
    fm.route_id,
    r.route_name,
    fm.is_base_fare,
    fm.effective_date,
    fm.expiry_date,
    fm.status,
    fm.created_at,
    fm.updated_at
FROM fare_matrix fm
JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
JOIN routes r ON fm.route_id = r.id
WHERE fm.status = 'active' 
AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
AND fm.effective_date <= CURRENT_DATE;

-- Add comments to the tables
ALTER TABLE `fare_matrix` COMMENT = 'Dynamic fare matrix for all checkpoint combinations';
ALTER TABLE `fare_matrix_history` COMMENT = 'Audit trail for fare matrix changes';

-- Show the created fare matrix
SELECT 
    r.route_name,
    c1.checkpoint_name as from_checkpoint,
    c2.checkpoint_name as to_checkpoint,
    fm.fare_amount,
    fm.is_base_fare,
    fm.effective_date
FROM fare_matrix fm
JOIN routes r ON fm.route_id = r.id
JOIN checkpoints c1 ON fm.from_checkpoint_id = c1.id
JOIN checkpoints c2 ON fm.to_checkpoint_id = c2.id
WHERE fm.status = 'active'
ORDER BY r.route_name, c1.sequence_order, c2.sequence_order
LIMIT 20;
