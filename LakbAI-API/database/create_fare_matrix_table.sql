-- =============================================
-- Dynamic Fare Matrix Table Creation Script
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
-- This will create a symmetric fare matrix based on the LRT-1 concept

-- First, let's get the checkpoint data for both routes
-- Route 1: SM Epza → SM Dasmariñas (Route ID 1)
-- Route 2: SM Dasmariñas → SM Epza (Route ID 2)

-- Insert fare matrix for Route 1 (SM Epza → SM Dasmariñas)
-- Base fare: 13 (as specified by user)
-- We'll create a symmetric matrix similar to LRT-1

-- Get checkpoints for Route 1
SET @route1_id = 1;
SET @base_fare = 13.00;

-- Create a stored procedure to generate the fare matrix
DELIMITER //

CREATE PROCEDURE GenerateFareMatrix(IN route_id INT, IN base_fare DECIMAL(8,2))
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE from_id INT;
    DECLARE to_id INT;
    DECLARE from_order INT;
    DECLARE to_order INT;
    DECLARE fare_amount DECIMAL(8,2);
    
    -- Cursor for all checkpoints in the route
    DECLARE checkpoint_cursor CURSOR FOR 
        SELECT id, sequence_order FROM checkpoints 
        WHERE route_id = route_id AND status = 'active' 
        ORDER BY sequence_order;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Clear existing fare matrix for this route
    DELETE FROM fare_matrix WHERE route_id = route_id;
    
    OPEN checkpoint_cursor;
    
    -- Generate fare matrix
    read_loop: LOOP
        FETCH checkpoint_cursor INTO from_id, from_order;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Reset cursor for inner loop
        SET done = FALSE;
        
        -- Create a temporary table for the inner loop
        CREATE TEMPORARY TABLE temp_checkpoints AS
        SELECT id, sequence_order FROM checkpoints 
        WHERE route_id = route_id AND status = 'active' 
        ORDER BY sequence_order;
        
        -- Inner loop for destination checkpoints
        inner_loop: LOOP
            SELECT id, sequence_order INTO to_id, to_order FROM temp_checkpoints LIMIT 1;
            IF to_id IS NULL THEN
                LEAVE inner_loop;
            END IF;
            
            -- Calculate fare based on distance (similar to LRT-1 matrix)
            IF from_order = to_order THEN
                -- Same checkpoint - base fare
                SET fare_amount = base_fare;
            ELSE
                -- Different checkpoints - calculate based on distance
                SET fare_amount = base_fare + (ABS(to_order - from_order) * 2.5);
            END IF;
            
            -- Insert fare matrix entry
            INSERT INTO fare_matrix (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date)
            VALUES (from_id, to_id, fare_amount, route_id, (from_order = to_order), CURRENT_DATE);
            
            -- Remove processed checkpoint from temp table
            DELETE FROM temp_checkpoints WHERE id = to_id;
        END LOOP;
        
        DROP TEMPORARY TABLE temp_checkpoints;
    END LOOP;
    
    CLOSE checkpoint_cursor;
END //

DELIMITER ;

-- Generate fare matrix for Route 1
CALL GenerateFareMatrix(1, @base_fare);

-- Generate fare matrix for Route 2 (reverse route)
CALL GenerateFareMatrix(2, @base_fare);

-- Drop the stored procedure
DROP PROCEDURE GenerateFareMatrix;

-- Create indexes for better performance
CREATE INDEX `idx_fare_lookup` ON `fare_matrix` (`from_checkpoint_id`, `to_checkpoint_id`, `route_id`, `status`, `effective_date`);

-- Insert some sample fare matrix entries with comments
INSERT INTO fare_matrix (from_checkpoint_id, to_checkpoint_id, fare_amount, route_id, is_base_fare, effective_date) VALUES
-- Route 1 examples (SM Epza → SM Dasmariñas)
(1, 1, 13.00, 1, 1, CURRENT_DATE),  -- SM Epza to SM Epza (base fare)
(1, 2, 15.50, 1, 0, CURRENT_DATE),  -- SM Epza to Robinson Tejero
(1, 3, 18.00, 1, 0, CURRENT_DATE),  -- SM Epza to Malabon
(2, 2, 13.00, 1, 1, CURRENT_DATE),  -- Robinson Tejero to Robinson Tejero (base fare)
(2, 3, 15.50, 1, 0, CURRENT_DATE),  -- Robinson Tejero to Malabon
(17, 17, 13.00, 1, 1, CURRENT_DATE), -- SM Dasmariñas to SM Dasmariñas (base fare)
(17, 16, 15.50, 1, 0, CURRENT_DATE), -- SM Dasmariñas to Robinson Dasmariñas
(17, 1, 50.00, 1, 0, CURRENT_DATE);  -- SM Dasmariñas to SM Epza (full route)

-- Route 2 examples (SM Dasmariñas → SM Epza)
(18, 18, 13.00, 2, 1, CURRENT_DATE), -- SM Dasmariñas to SM Dasmariñas (base fare)
(18, 19, 15.50, 2, 0, CURRENT_DATE), -- SM Dasmariñas to SM Epza
(19, 19, 13.00, 2, 1, CURRENT_DATE), -- SM Epza to SM Epza (base fare)
(19, 18, 50.00, 2, 0, CURRENT_DATE); -- SM Epza to SM Dasmariñas (full route)

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

-- Create a function to get fare between two checkpoints
DELIMITER //

CREATE FUNCTION GetFareBetweenCheckpoints(
    from_checkpoint_id INT,
    to_checkpoint_id INT,
    route_id INT
) RETURNS DECIMAL(8,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE fare_amount DECIMAL(8,2) DEFAULT NULL;
    
    -- Try to find direct fare
    SELECT fm.fare_amount INTO fare_amount
    FROM fare_matrix fm
    WHERE fm.from_checkpoint_id = from_checkpoint_id
    AND fm.to_checkpoint_id = to_checkpoint_id
    AND fm.route_id = route_id
    AND fm.status = 'active'
    AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
    AND fm.effective_date <= CURRENT_DATE
    ORDER BY fm.effective_date DESC
    LIMIT 1;
    
    -- If not found, try reverse direction (symmetric matrix)
    IF fare_amount IS NULL THEN
        SELECT fm.fare_amount INTO fare_amount
        FROM fare_matrix fm
        WHERE fm.from_checkpoint_id = to_checkpoint_id
        AND fm.to_checkpoint_id = from_checkpoint_id
        AND fm.route_id = route_id
        AND fm.status = 'active'
        AND (fm.expiry_date IS NULL OR fm.expiry_date >= CURRENT_DATE)
        AND fm.effective_date <= CURRENT_DATE
        ORDER BY fm.effective_date DESC
        LIMIT 1;
    END IF;
    
    -- If still not found, calculate based on fare_from_origin
    IF fare_amount IS NULL THEN
        SELECT ABS(c2.fare_from_origin - c1.fare_from_origin) INTO fare_amount
        FROM checkpoints c1
        JOIN checkpoints c2 ON c1.route_id = c2.route_id
        WHERE c1.id = from_checkpoint_id AND c2.id = to_checkpoint_id
        AND c1.route_id = route_id;
    END IF;
    
    -- Return base fare if still null
    IF fare_amount IS NULL THEN
        SET fare_amount = 13.00;
    END IF;
    
    RETURN fare_amount;
END //

DELIMITER ;

-- Create trigger to log fare matrix changes
DELIMITER //

CREATE TRIGGER fare_matrix_audit_trigger
AFTER INSERT ON fare_matrix
FOR EACH ROW
BEGIN
    INSERT INTO fare_matrix_history (
        fare_matrix_id,
        from_checkpoint_id,
        to_checkpoint_id,
        old_fare_amount,
        new_fare_amount,
        route_id,
        change_type,
        changed_by,
        change_reason
    ) VALUES (
        NEW.id,
        NEW.from_checkpoint_id,
        NEW.to_checkpoint_id,
        NULL,
        NEW.fare_amount,
        NEW.route_id,
        'created',
        'system',
        'Fare matrix entry created'
    );
END //

CREATE TRIGGER fare_matrix_update_trigger
AFTER UPDATE ON fare_matrix
FOR EACH ROW
BEGIN
    INSERT INTO fare_matrix_history (
        fare_matrix_id,
        from_checkpoint_id,
        to_checkpoint_id,
        old_fare_amount,
        new_fare_amount,
        route_id,
        change_type,
        changed_by,
        change_reason
    ) VALUES (
        NEW.id,
        NEW.from_checkpoint_id,
        NEW.to_checkpoint_id,
        OLD.fare_amount,
        NEW.fare_amount,
        NEW.route_id,
        'updated',
        'system',
        'Fare matrix entry updated'
    );
END //

DELIMITER ;

-- Add comments to the tables
ALTER TABLE `fare_matrix` COMMENT = 'Dynamic fare matrix for all checkpoint combinations';
ALTER TABLE `fare_matrix_history` COMMENT = 'Audit trail for fare matrix changes';
ALTER TABLE `fare_matrix_view` COMMENT = 'View for easy fare lookup with checkpoint names';

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
