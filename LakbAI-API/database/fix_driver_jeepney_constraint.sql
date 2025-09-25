-- =============================================
-- Fix Driver-Jeepney Assignment Constraint
-- =============================================

USE `lakbai_db`;

-- First, let's check for any existing conflicts (drivers with multiple jeepneys)
SELECT 
    driver_id,
    COUNT(*) as jeepney_count,
    GROUP_CONCAT(jeepney_number) as jeepney_numbers
FROM jeepneys 
WHERE driver_id IS NOT NULL 
GROUP BY driver_id 
HAVING COUNT(*) > 1;

-- If there are conflicts, we need to resolve them first
-- For now, let's add a unique constraint on driver_id for active jeepneys only
-- This allows drivers to be unassigned (NULL) but prevents multiple active assignments

-- Add unique constraint on driver_id for active jeepneys
-- Note: This will only work if there are no existing conflicts
ALTER TABLE jeepneys 
ADD CONSTRAINT uk_driver_active 
UNIQUE (driver_id, status) 
WHERE status = 'active' AND driver_id IS NOT NULL;

-- Alternative approach: Add a unique index on driver_id where status = 'active'
-- This is more flexible and allows for future status changes
CREATE UNIQUE INDEX idx_unique_active_driver 
ON jeepneys (driver_id) 
WHERE status = 'active' AND driver_id IS NOT NULL;

-- Add a check constraint to ensure data integrity
ALTER TABLE jeepneys 
ADD CONSTRAINT chk_driver_assignment 
CHECK (
    (driver_id IS NULL) OR 
    (driver_id IS NOT NULL AND status = 'active')
);

-- Create a view for easy monitoring of driver assignments
CREATE OR REPLACE VIEW driver_jeepney_assignments AS
SELECT 
    u.id as driver_id,
    u.first_name,
    u.last_name,
    u.phone_number,
    j.id as jeepney_id,
    j.jeepney_number,
    j.plate_number,
    j.model,
    j.capacity,
    r.route_name,
    j.status as jeepney_status,
    j.created_at as assignment_date
FROM users u
LEFT JOIN jeepneys j ON u.id = j.driver_id AND j.status = 'active'
LEFT JOIN routes r ON j.route_id = r.id
WHERE u.user_type = 'driver'
ORDER BY u.first_name, u.last_name;

-- Create a function to check if driver can be assigned to jeepney
DELIMITER //
CREATE FUNCTION can_assign_driver_to_jeepney(driver_id INT, jeepney_id INT) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE driver_exists BOOLEAN DEFAULT FALSE;
    DECLARE jeepney_available BOOLEAN DEFAULT FALSE;
    DECLARE driver_has_jeepney BOOLEAN DEFAULT FALSE;
    
    -- Check if driver exists and is a driver
    SELECT COUNT(*) > 0 INTO driver_exists
    FROM users 
    WHERE id = driver_id AND user_type = 'driver';
    
    -- Check if jeepney exists and is available
    SELECT COUNT(*) > 0 INTO jeepney_available
    FROM jeepneys 
    WHERE id = jeepney_id AND status = 'active' AND (driver_id IS NULL OR driver_id = driver_id);
    
    -- Check if driver already has an active jeepney (excluding the current jeepney)
    SELECT COUNT(*) > 0 INTO driver_has_jeepney
    FROM jeepneys 
    WHERE driver_id = driver_id AND status = 'active' AND id != jeepney_id;
    
    RETURN driver_exists AND jeepney_available AND NOT driver_has_jeepney;
END//
DELIMITER ;

-- Create a trigger to prevent invalid driver assignments
DELIMITER //
CREATE TRIGGER tr_jeepney_driver_assignment_check
BEFORE INSERT ON jeepneys
FOR EACH ROW
BEGIN
    IF NEW.driver_id IS NOT NULL THEN
        -- Check if driver already has an active jeepney
        IF EXISTS (
            SELECT 1 FROM jeepneys 
            WHERE driver_id = NEW.driver_id 
            AND status = 'active' 
            AND id != NEW.id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Driver is already assigned to an active jeepney';
        END IF;
        
        -- Check if driver exists and is a driver
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = NEW.driver_id AND user_type = 'driver'
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid driver ID or user is not a driver';
        END IF;
    END IF;
END//
DELIMITER ;

-- Create a trigger for updates as well
DELIMITER //
CREATE TRIGGER tr_jeepney_driver_assignment_check_update
BEFORE UPDATE ON jeepneys
FOR EACH ROW
BEGIN
    IF NEW.driver_id IS NOT NULL AND NEW.driver_id != OLD.driver_id THEN
        -- Check if driver already has an active jeepney (excluding current jeepney)
        IF EXISTS (
            SELECT 1 FROM jeepneys 
            WHERE driver_id = NEW.driver_id 
            AND status = 'active' 
            AND id != NEW.id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Driver is already assigned to an active jeepney';
        END IF;
        
        -- Check if driver exists and is a driver
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = NEW.driver_id AND user_type = 'driver'
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid driver ID or user is not a driver';
        END IF;
    END IF;
END//
DELIMITER ;

-- Show the current state
SELECT 'Current driver-jeepney assignments:' as info;
SELECT * FROM driver_jeepney_assignments WHERE jeepney_id IS NOT NULL;

SELECT 'Drivers without jeepney assignments:' as info;
SELECT * FROM driver_jeepney_assignments WHERE jeepney_id IS NULL;
